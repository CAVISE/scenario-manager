import asyncio
import os
import shutil
import threading
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta
from pathlib import Path
from urllib.parse import quote

from fastapi import APIRouter, HTTPException, Request, WebSocket, WebSocketDisconnect

from app.config import get_settings
from app.log_config import get_logger
from app.rate_limit import limiter
from app.run_results import MANIFEST_NAME, read_run_metadata, write_run_metadata
from app.schemas import (
    ResultFile,
    ResultRun,
    ResultsResponse,
    SimulationStatusResponse,
    StartSimulationRequest,
    StartSimulationResponse,
    StopSimulationResponse,
)

router = APIRouter(tags=["simulation"])
log = get_logger(__name__)

_sim_lock = threading.Lock()
simulation_state: dict = {
    "running": False,
    "status": "idle",
    "error": None,
    "map": None,
    "run_id": None,
    "tick": 0,
    "max_ticks": 0,
    "partial": False,
}

_executor = ThreadPoolExecutor(max_workers=1)

_ws_clients: list[WebSocket] = []
_ws_lock = threading.Lock()

_main_loop: asyncio.AbstractEventLoop | None = None


def _result_directory(run_id: str) -> Path:
    root = get_settings().eval_dir.resolve()
    path = root / run_id
    if (
        not run_id
        or ".." in run_id
        or any(char in run_id for char in "/\\:")
        or path.is_symlink()
        or path.resolve().parent != root
    ):
        raise HTTPException(status_code=400, detail="Invalid run_id")
    return path


@router.get("/results", response_model=list[ResultRun])
@limiter.limit("30/minute")
async def list_result_runs(request: Request):
    settings = get_settings()
    if not settings.eval_dir.exists():
        return []

    runs: list[ResultRun] = []
    for entry in settings.eval_dir.iterdir():
        if (
            not entry.is_dir()
            or entry.is_symlink()
            or ".." in entry.name
            or any(char in entry.name for char in "/\\:")
        ):
            continue
        metadata = read_run_metadata(entry)
        if metadata.get("outcome") not in {"complete", "partial", "legacy"}:
            continue
        if simulation_state["running"] and entry.name == simulation_state["run_id"]:
            continue
        files = [
            item
            for item in entry.iterdir()
            if item.is_file()
            and item.name != MANIFEST_NAME
            and item.suffix in {".png", ".txt", ".log", ".yaml", ".json"}
        ]
        runs.append(
            ResultRun(
                run_id=entry.name,
                files_count=len(files),
                modified_at=entry.stat().st_mtime,
                outcome=metadata.get("outcome", "legacy"),
                tick=metadata.get("tick"),
                max_ticks=metadata.get("max_ticks"),
                scenario_name=metadata.get("scenario_name"),
                scenario_id=metadata.get("scenario_id"),
            )
        )

    return sorted(runs, key=lambda run: run.modified_at, reverse=True)


async def _send_state(ws: WebSocket) -> None:
    try:
        await ws.send_json(simulation_state)
    except Exception:
        with _ws_lock:
            if ws in _ws_clients:
                _ws_clients.remove(ws)


def _broadcast_state() -> None:
    global _main_loop
    loop = _main_loop
    if loop is None or loop.is_closed():
        log.warning("_broadcast_state: no event loop available, skipping")
        return

    with _ws_lock:
        clients = list(_ws_clients)

    for ws in clients:
        asyncio.run_coroutine_threadsafe(_send_state(ws), loop)


@router.post("/start_opencda", response_model=StartSimulationResponse)
@limiter.limit("5/minute")
async def start_opencda(request: Request, body: StartSimulationRequest):
    settings = get_settings()

    with _sim_lock:
        if simulation_state["running"]:
            raise HTTPException(status_code=409, detail="Simulation already running")
        simulation_state["running"] = True
        simulation_state["status"] = "running"
        simulation_state["error"] = None
        simulation_state.update(tick=0, max_ticks=body.max_ticks, partial=False)

    try:
        map_name = _normalize_map_name(body.map)

        log.debug("start_opencda map=%s max_ticks=%d", map_name, body.max_ticks)

        if body.xodr:
            xodr_dir = settings.xodr_dir
            xodr_dir.mkdir(parents=True, exist_ok=True)
            (xodr_dir / f"{map_name}.xodr").write_text(body.xodr)

        current_time = datetime.now().strftime("%Y_%m_%d_%H_%M_%S_%f")
        run_id = f"{map_name}_{current_time}"

        with _sim_lock:
            simulation_state["map"] = map_name
            simulation_state["run_id"] = run_id

        scenario_raw = body.model_dump()
        try:
            keys = list(scenario_raw.keys())
            xodr_info = None
            if scenario_raw.get("xodr"):
                try:
                    xodr_len = len(scenario_raw.get("xodr") or "")
                    xodr_info = f"present (length={xodr_len})"
                except Exception:
                    xodr_info = "present (length=?)"
            else:
                xodr_info = "absent"

            log.info("Received payload keys: %s | xodr: %s", keys, xodr_info)
            log.info(
                "Received attacks field from request: %s", scenario_raw.get("attacks")
            )
        except Exception:
            log.exception("Failed to log request payload for debugging")

        params = {
            "apply_ml": False,
            "record": False,
            "map_name": map_name,
            "max_ticks": body.max_ticks,
            "current_time": current_time,
        }

        _executor.submit(_run_with_state, scenario_raw, params)
    except Exception:
        with _sim_lock:
            simulation_state["running"] = False
            simulation_state["status"] = "idle"
            simulation_state["error"] = None
        log.exception("start_opencda failed before the simulation task started")
        raise HTTPException(
            status_code=500,
            detail="Failed to start simulation; see server logs for details",
        )

    return StartSimulationResponse(status="started", map=map_name)


@router.get("/status", response_model=SimulationStatusResponse)
async def get_status():
    return SimulationStatusResponse(**simulation_state)


@router.post("/stop", response_model=StopSimulationResponse)
@limiter.limit("10/minute")
async def stop_simulation(request: Request):
    if not simulation_state["running"]:
        raise HTTPException(status_code=400, detail="No simulation running")
    from app import runner

    runner.request_stop()
    with _sim_lock:
        simulation_state["status"] = "stopping"
    return StopSimulationResponse(status="stopping")


@router.get("/results/{run_id}", response_model=ResultsResponse)
@limiter.limit("30/minute")
async def list_results(request: Request, run_id: str):
    path = _result_directory(run_id)
    if not path.exists() or not path.is_dir():
        raise HTTPException(status_code=404, detail="Results not found")
    if simulation_state["running"] and run_id == simulation_state["run_id"]:
        raise HTTPException(status_code=409, detail="Simulation is still running")
    if read_run_metadata(path).get("outcome") not in {"complete", "partial", "legacy"}:
        raise HTTPException(status_code=404, detail="No completed results for this run")

    files = [
        ResultFile(
            filename=f,
            url=f"/evaluation_outputs/{quote(run_id, safe='')}/{quote(f, safe='')}",
        )
        for f in sorted(os.listdir(path))
        if f != MANIFEST_NAME
        and (path / f).is_file()
        and f.endswith((".png", ".txt", ".log", ".yaml", ".json"))
    ]
    return ResultsResponse(files=files, run_id=run_id)


@router.delete("/results/{run_id}")
@limiter.limit("10/minute")
async def delete_results(request: Request, run_id: str):
    path = _result_directory(run_id)
    with _sim_lock:
        if simulation_state["running"] and run_id == simulation_state["run_id"]:
            raise HTTPException(
                status_code=409, detail="Cannot delete results of a running simulation"
            )
        if not path.is_dir():
            raise HTTPException(status_code=404, detail="Results not found")
        shutil.rmtree(path)
    log.info("Deleted results for run_id=%s", run_id)
    return {"deleted": run_id}


@router.websocket("/ws/simulation")
async def ws_simulation(websocket: WebSocket):
    global _main_loop

    await websocket.accept()

    if _main_loop is None:
        _main_loop = asyncio.get_event_loop()

    with _ws_lock:
        _ws_clients.append(websocket)

    try:
        await websocket.send_json(simulation_state)
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        with _ws_lock:
            if websocket in _ws_clients:
                _ws_clients.remove(websocket)


_KNOWN_MAPS = {
    m.lower(): m
    for m in [
        "Town01",
        "Town02",
        "Town03",
        "Town04",
        "Town05",
        "Town06",
        "Town07",
        "Town10HD",
        "Town11",
        "Town12",
    ]
}


def _normalize_map_name(name: str) -> str:
    return _KNOWN_MAPS.get(name.lower(), name)


def _run_with_state(scenario_raw: dict, params: dict) -> None:
    import traceback

    run_id = (
        f"{params['map_name']}_{params['current_time']}"
        if params.get("map_name") and params.get("current_time")
        else None
    )
    metadata = {
        "outcome": "running",
        "scenario_id": scenario_raw.get("scenario_id"),
        "scenario_name": scenario_raw.get("scenario_name"),
        "max_ticks": params.get("max_ticks", 0),
        "tick": 0,
    }

    def progress(tick: int, maximum: int) -> None:
        with _sim_lock:
            simulation_state.update(tick=tick, max_ticks=maximum)
        _broadcast_state()

    try:
        write_run_metadata(run_id, metadata)
        from app import runner

        result = runner.run_scenario(scenario_raw, {**params, "on_progress": progress})
        outcome = result if isinstance(result, dict) else {}
        with _sim_lock:
            partial = outcome.get("partial", simulation_state["status"] == "stopping")
            simulation_state.update(
                tick=outcome.get("tick", simulation_state.get("tick", 0)),
                max_ticks=outcome.get("max_ticks", params.get("max_ticks", 0)),
                partial=partial,
            )
            simulation_state["status"] = "finished"
        write_run_metadata(
            run_id,
            {
                **metadata,
                "outcome": "partial" if partial else "complete",
                "tick": simulation_state["tick"],
            },
        )
    except Exception as e:
        try:
            write_run_metadata(
                run_id, {**metadata, "outcome": "failed", "error": str(e)}
            )
        except OSError:
            log.exception("Failed to persist run failure")
        with _sim_lock:
            simulation_state["status"] = "error"
            simulation_state["error"] = str(e)
            simulation_state["run_id"] = None
            simulation_state["partial"] = False
        log.error("SIMULATION ERROR:\n%s", traceback.format_exc())
    finally:
        with _sim_lock:
            simulation_state["running"] = False
            if simulation_state["status"] == "stopping":
                simulation_state["status"] = "idle"
        _broadcast_state()


def cleanup_old_results() -> None:
    settings = get_settings()
    cutoff = datetime.now() - timedelta(days=settings.eval_retention_days)
    eval_dir = settings.eval_dir
    if not eval_dir.exists():
        return
    for entry in eval_dir.iterdir():
        if entry.is_dir() and not entry.is_symlink():
            mtime = datetime.fromtimestamp(entry.stat().st_mtime)
            if mtime < cutoff:
                with _sim_lock:
                    if (
                        simulation_state["running"]
                        and entry.name == simulation_state["run_id"]
                    ):
                        continue
                    shutil.rmtree(entry)
                    log.info("Auto-cleaned old results: %s", entry.name)
