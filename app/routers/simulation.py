import asyncio
import os
import shutil
import threading
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta

from fastapi import APIRouter, HTTPException, Request, WebSocket, WebSocketDisconnect

from app.config import get_settings
from app.log_config import get_logger
from app.rate_limit import limiter
from app.schemas import (
    ResultFile,
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
}

_executor = ThreadPoolExecutor(max_workers=1)

_ws_clients: list[WebSocket] = []
_ws_lock = threading.Lock()

_main_loop: asyncio.AbstractEventLoop | None = None


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

    try:
        map_name = _normalize_map_name(body.map)

        log.debug("start_opencda map=%s max_ticks=%d", map_name, body.max_ticks)

        if body.xodr:
            xodr_dir = settings.xodr_dir
            xodr_dir.mkdir(parents=True, exist_ok=True)
            (xodr_dir / f"{map_name}.xodr").write_text(body.xodr)

        current_time = datetime.now().strftime("%Y_%m_%d_%H_%M_%S")
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
            log.info("Received attacks field from request: %s", scenario_raw.get("attacks"))
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
    if ".." in run_id or "/" in run_id:
        raise HTTPException(status_code=400, detail="Invalid run_id")

    settings = get_settings()
    path = settings.eval_dir / run_id
    if not path.exists():
        raise HTTPException(status_code=404, detail="Results not found")

    files = [
        ResultFile(
            filename=f,
            url=f"/evaluation_outputs/{run_id}/{f}",
        )
        for f in sorted(os.listdir(path))
        if f.endswith((".png", ".txt", ".log", ".yaml", ".json"))
    ]
    return ResultsResponse(files=files, run_id=run_id)


@router.delete("/results/{run_id}")
@limiter.limit("10/minute")
async def delete_results(request: Request, run_id: str):
    if ".." in run_id or "/" in run_id:
        raise HTTPException(status_code=400, detail="Invalid run_id")

    settings = get_settings()
    path = settings.eval_dir / run_id
    if not path.exists():
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


_KNOWN_MAPS = {m.lower(): m for m in [
    "Town01", "Town02", "Town03", "Town04", "Town05",
    "Town06", "Town07", "Town10HD", "Town11", "Town12",
]}


def _normalize_map_name(name: str) -> str:
    return _KNOWN_MAPS.get(name.lower(), name)


def _run_with_state(scenario_raw: dict, params: dict) -> None:
    import traceback
    try:
        from app import runner
        runner.run_scenario(scenario_raw, params)
        with _sim_lock:
            simulation_state["status"] = "finished"
    except Exception as e:
        with _sim_lock:
            simulation_state["status"] = "error"
            simulation_state["error"] = str(e)
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
        if entry.is_dir():
            mtime = datetime.fromtimestamp(entry.stat().st_mtime)
            if mtime < cutoff:
                shutil.rmtree(entry)
                log.info("Auto-cleaned old results: %s", entry.name)
