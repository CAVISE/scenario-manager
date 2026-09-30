import asyncio
import json
import shutil
import threading
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Request,
    WebSocket,
    WebSocketDisconnect,
)
from fastapi.responses import FileResponse
from pydantic import ValidationError

from app.auth import require_roles
from app.config import get_settings
from app.database import SessionLocal
from app.log_config import get_logger
from app.rate_limit import limiter
from app.run_results import read_run_metadata, write_run_metadata
from app.services.simulation.contracts import QueuedSimulation
from app.services.simulation.repository import SimulationRunRepository
from app.services.simulation.results import (
    COMPLETED_OUTCOMES,
    ResultAccessError,
    list_completed_runs,
    public_result_files,
    read_chart_data,
    result_directory,
    result_file_path,
    result_file_url,
)
from app.services.simulation.validation import preflight_entity_issues
from app.services.simulation.worker import launch_worker, stop_worker
from app.schemas import (
    ResultFile,
    ResultRun,
    ResultsResponse,
    ScenarioValidationIssue,
    ScenarioValidationResponse,
    SimulationRunResponse,
    SimulationStatusResponse,
    StartSimulationRequest,
    StartSimulationResponse,
    StopSimulationResponse,
)

router = APIRouter(
    tags=["simulation"],
    dependencies=[Depends(require_roles("admin", "operator", "viewer"))],
)
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


_run_queue: list[QueuedSimulation] = []
_run_repository = SimulationRunRepository(SessionLocal)

_ws_clients: list[WebSocket] = []
_ws_lock = threading.Lock()
_run_ws_clients: dict[str, list[WebSocket]] = {}

_main_loop: asyncio.AbstractEventLoop | None = None
_active_worker: Any | None = None
_active_worker_lock = threading.Lock()


def _request_active_worker_stop() -> None:
    with _active_worker_lock:
        worker = _active_worker
    if worker is None or worker.poll() is not None:
        return

    grace_seconds = get_settings().simulation_stop_grace_seconds
    threading.Thread(
        target=stop_worker,
        args=(worker, grace_seconds),
        name="simulation-stop",
        daemon=True,
    ).start()


def _save_run_record(queued_run: QueuedSimulation, status: str = "queued") -> None:
    _run_repository.save(queued_run, status)


def _update_run_record(run_id: str, status: str, error: str | None = None) -> None:
    _run_repository.update(run_id, status, error)


def recover_persisted_queue() -> None:
    """Rebuild the in-process worker queue after a backend restart."""
    queued_runs = _run_repository.recover_queue()

    with _sim_lock:
        known_run_ids = {item.run_id for item in _run_queue}
        _run_queue.extend(run for run in queued_runs if run.run_id not in known_run_ids)
    _schedule_next_run()


def _result_directory(run_id: str) -> Path:
    try:
        return result_directory(get_settings().eval_dir, run_id)
    except ResultAccessError as error:
        raise HTTPException(
            status_code=error.status_code, detail=error.detail
        ) from error


def _result_file_url(run_id: str, filename: str) -> str:
    return result_file_url(run_id, filename)


def _result_file_path(run_id: str, filename: str) -> Path:
    try:
        return result_file_path(get_settings().eval_dir, run_id, filename)
    except ResultAccessError as error:
        raise HTTPException(
            status_code=error.status_code, detail=error.detail
        ) from error


def _status_from_outcome(outcome: str | None) -> str:
    return {
        "queued": "queued",
        "running": "running",
        "stopping": "stopping",
        "complete": "finished",
        "partial": "finished",
        "failed": "error",
        "cancelled": "cancelled",
    }.get(outcome or "", "finished")


def _run_response(run_id: str) -> SimulationRunResponse:
    with _sim_lock:
        current = dict(simulation_state)
        queue_position = next(
            (
                index
                for index, queued_run in enumerate(_run_queue, start=1)
                if queued_run.run_id == run_id
            ),
            None,
        )

    if current.get("run_id") == run_id:
        return SimulationRunResponse(**current)

    path = _result_directory(run_id)
    if not path.is_dir():
        raise HTTPException(status_code=404, detail="Run not found")

    metadata = read_run_metadata(path)
    outcome = metadata.get("outcome")
    if outcome == "legacy":
        status = "finished"
    elif outcome not in {
        "queued",
        "running",
        "stopping",
        "complete",
        "partial",
        "failed",
        "cancelled",
    }:
        raise HTTPException(status_code=404, detail="Run metadata is unavailable")
    else:
        status = _status_from_outcome(outcome)

    return SimulationRunResponse(
        running=status in {"running", "stopping"},
        status=status,
        error=metadata.get("error"),
        map=metadata.get("map"),
        run_id=run_id,
        tick=metadata.get("tick", 0),
        max_ticks=metadata.get("max_ticks", 0),
        partial=outcome == "partial",
        scenario_id=metadata.get("scenario_id"),
        scenario_name=metadata.get("scenario_name"),
        modified_at=path.stat().st_mtime,
        queue_position=queue_position,
    )


@router.get("/results", response_model=list[ResultRun])
@limiter.limit("30/minute")
async def list_result_runs(request: Request):
    active_run_id = simulation_state["run_id"] if simulation_state["running"] else None
    return list_completed_runs(get_settings().eval_dir, active_run_id=active_run_id)


async def _send_state(ws: WebSocket) -> None:
    try:
        await ws.send_json(simulation_state)
    except Exception:
        with _ws_lock:
            if ws in _ws_clients:
                _ws_clients.remove(ws)


async def _send_run_state(ws: WebSocket, run_id: str) -> None:
    try:
        await ws.send_json(_run_response(run_id).model_dump())
    except Exception:
        with _ws_lock:
            clients = _run_ws_clients.get(run_id, [])
            if ws in clients:
                clients.remove(ws)


def _broadcast_state() -> None:
    global _main_loop
    loop = _main_loop
    if loop is None or loop.is_closed():
        log.warning("_broadcast_state: no event loop available, skipping")
        return

    with _ws_lock:
        clients = list(_ws_clients)
        run_clients = {run_id: list(items) for run_id, items in _run_ws_clients.items()}

    for ws in clients:
        asyncio.run_coroutine_threadsafe(_send_state(ws), loop)
    for run_id, subscribers in run_clients.items():
        for ws in subscribers:
            asyncio.run_coroutine_threadsafe(_send_run_state(ws, run_id), loop)


def _schedule_next_run() -> None:
    """Reserve CARLA for the next queued run and submit exactly one worker."""
    with _sim_lock:
        if simulation_state["running"] or not _run_queue:
            return

        queued_run = _run_queue.pop(0)
        simulation_state.update(
            running=True,
            status="running",
            error=None,
            map=queued_run.map_name,
            run_id=queued_run.run_id,
            tick=0,
            max_ticks=queued_run.params["max_ticks"],
            partial=False,
        )
        _update_run_record(queued_run.run_id, "running")

    try:
        _executor.submit(
            _run_with_state,
            queued_run.scenario_raw,
            queued_run.params,
        )
    except Exception as error:
        log.exception("Could not submit queued simulation run=%s", queued_run.run_id)
        _update_run_record(queued_run.run_id, "failed", str(error))
        write_run_metadata(
            queued_run.run_id,
            {
                "outcome": "failed",
                "map": queued_run.map_name,
                "scenario_id": queued_run.scenario_raw.get("scenario_id"),
                "scenario_name": queued_run.scenario_raw.get("scenario_name"),
                "max_ticks": queued_run.params["max_ticks"],
                "tick": 0,
                "error": str(error),
            },
        )
        with _sim_lock:
            simulation_state.update(
                running=False,
                status="error",
                error=str(error),
                partial=False,
            )
        _broadcast_state()
        _schedule_next_run()
        return

    _broadcast_state()


def _start_simulation(
    body: StartSimulationRequest, *, allow_queue: bool = False
) -> StartSimulationResponse:
    settings = get_settings()

    with _sim_lock:
        if (simulation_state["running"] or _run_queue) and not allow_queue:
            raise HTTPException(status_code=409, detail="Simulation already running")

    try:
        map_name = _normalize_map_name(body.map)
        current_time = datetime.now().strftime("%Y_%m_%d_%H_%M_%S_%f")
        run_id = f"{map_name}_{current_time}"

        log.debug("start_opencda map=%s max_ticks=%d", map_name, body.max_ticks)

        custom_xodr_path = None
        if body.xodr:
            xodr_dir = settings.xodr_dir
            xodr_dir.mkdir(parents=True, exist_ok=True)
            custom_xodr_path = xodr_dir / f"{run_id}.xodr"
            temporary_xodr_path = custom_xodr_path.with_suffix(".xodr.tmp")
            temporary_xodr_path.write_text(body.xodr, encoding="utf-8")
            temporary_xodr_path.replace(custom_xodr_path)

        write_run_metadata(
            run_id,
            {
                "outcome": "queued",
                "map": map_name,
                "scenario_id": body.scenario_id,
                "scenario_name": body.scenario_name,
                "max_ticks": body.max_ticks,
                "tick": 0,
            },
        )

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
            "run_id": run_id,
            "xodr_path": str(custom_xodr_path) if custom_xodr_path else None,
        }
        queued_run = QueuedSimulation(
            run_id=run_id,
            map_name=map_name,
            scenario_raw=scenario_raw,
            params=params,
        )

        with _sim_lock:
            if (simulation_state["running"] or _run_queue) and not allow_queue:
                raise HTTPException(
                    status_code=409, detail="Simulation already running"
                )
            _save_run_record(queued_run)
            _run_queue.append(queued_run)
    except HTTPException:
        raise
    except Exception:
        log.exception("start_opencda failed before the simulation task started")
        raise HTTPException(
            status_code=500,
            detail="Failed to start simulation; see server logs for details",
        )

    _schedule_next_run()
    with _sim_lock:
        was_started = simulation_state["run_id"] == run_id
    return StartSimulationResponse(
        status="started" if was_started else "queued",
        map=map_name,
        run_id=run_id,
    )


@router.post(
    "/start_opencda",
    response_model=StartSimulationResponse,
    dependencies=[Depends(require_roles("admin", "operator"))],
)
@limiter.limit("5/minute")
async def start_opencda(request: Request, body: StartSimulationRequest):
    return _start_simulation(body)


@router.post(
    "/v1/runs",
    response_model=StartSimulationResponse,
    dependencies=[Depends(require_roles("admin", "operator"))],
)
@limiter.limit("5/minute")
async def create_run(request: Request, body: StartSimulationRequest):
    """Start a run immediately or enqueue it behind the active CARLA run."""
    return _start_simulation(body, allow_queue=True)


@router.post(
    "/v1/scenarios/validate",
    response_model=ScenarioValidationResponse,
    dependencies=[Depends(require_roles("admin", "operator"))],
)
@limiter.limit("30/minute")
async def validate_scenario(request: Request, body: dict[str, Any]):
    """Validate a run payload without reserving CARLA or creating a run."""
    try:
        StartSimulationRequest.model_validate(body)
    except ValidationError as error:
        detailed_issues = preflight_entity_issues(body)
        return ScenarioValidationResponse(
            valid=False,
            issues=[
                ScenarioValidationIssue(
                    code=item["type"],
                    message=item["msg"],
                    path=list(item["loc"]),
                )
                for item in error.errors()
            ]
            + detailed_issues,
        )
    return ScenarioValidationResponse(
        valid=True,
        issues=[
            issue
            for issue in preflight_entity_issues(body)
            if issue.severity == "warning"
        ],
    )


@router.get("/status", response_model=SimulationStatusResponse)
async def get_status():
    return SimulationStatusResponse(**simulation_state)


@router.get("/v1/runs", response_model=list[SimulationRunResponse])
@limiter.limit("30/minute")
async def list_runs(request: Request):
    settings = get_settings()
    if not settings.eval_dir.exists():
        return []

    runs: list[SimulationRunResponse] = []
    for entry in settings.eval_dir.iterdir():
        if (
            not entry.is_dir()
            or entry.is_symlink()
            or ".." in entry.name
            or any(char in entry.name for char in "/\\:")
        ):
            continue
        try:
            runs.append(_run_response(entry.name))
        except HTTPException:
            continue
    return sorted(runs, key=lambda run: run.modified_at or 0, reverse=True)


@router.get("/v1/runs/{run_id}", response_model=SimulationRunResponse)
@limiter.limit("30/minute")
async def get_run(request: Request, run_id: str):
    return _run_response(run_id)


def _stop_simulation(run_id: str | None = None) -> StopSimulationResponse:
    with _sim_lock:
        active_run_id = simulation_state["run_id"]
        if not simulation_state["running"]:
            raise HTTPException(status_code=400, detail="No simulation running")
        if run_id is not None and run_id != active_run_id:
            raise HTTPException(status_code=409, detail="Run is not active")
        simulation_state["status"] = "stopping"

    if active_run_id:
        try:
            existing = read_run_metadata(_result_directory(active_run_id))
            write_run_metadata(active_run_id, {**existing, "outcome": "stopping"})
        except (HTTPException, OSError, ValueError):
            log.warning("Could not persist stopping state for run=%s", active_run_id)

    _request_active_worker_stop()
    _broadcast_state()
    return StopSimulationResponse(status="stopping", run_id=active_run_id)


def _cancel_queued_simulation(run_id: str) -> StopSimulationResponse:
    """Remove a waiting run without affecting the CARLA process in progress."""
    with _sim_lock:
        queued_run = next((item for item in _run_queue if item.run_id == run_id), None)
        if queued_run is None:
            raise HTTPException(status_code=409, detail="Run is not active or queued")
        _run_queue.remove(queued_run)

    _update_run_record(run_id, "cancelled")

    try:
        metadata = read_run_metadata(_result_directory(run_id))
        write_run_metadata(run_id, {**metadata, "outcome": "cancelled"})
    except (HTTPException, OSError, ValueError):
        log.warning("Could not persist cancellation for queued run=%s", run_id)

    _broadcast_state()
    return StopSimulationResponse(status="cancelled", run_id=run_id)


@router.post(
    "/stop",
    response_model=StopSimulationResponse,
    dependencies=[Depends(require_roles("admin", "operator"))],
)
@limiter.limit("10/minute")
async def stop_simulation(request: Request):
    return _stop_simulation()


@router.post(
    "/v1/runs/{run_id}/cancel",
    response_model=StopSimulationResponse,
    dependencies=[Depends(require_roles("admin", "operator"))],
)
@limiter.limit("10/minute")
async def cancel_run(request: Request, run_id: str):
    with _sim_lock:
        is_active = simulation_state["running"] and simulation_state["run_id"] == run_id
    return _stop_simulation(run_id) if is_active else _cancel_queued_simulation(run_id)


@router.websocket("/v1/ws/runs/{run_id}")
async def ws_run(websocket: WebSocket, run_id: str):
    """Subscribe to the active run using the same payload as /v1/runs/{id}."""
    global _main_loop

    await websocket.accept()
    if _main_loop is None:
        _main_loop = asyncio.get_event_loop()
    with _ws_lock:
        _run_ws_clients.setdefault(run_id, []).append(websocket)
    try:
        await websocket.send_json(_run_response(run_id).model_dump())
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        with _ws_lock:
            clients = _run_ws_clients.get(run_id, [])
            if websocket in clients:
                clients.remove(websocket)
            if not clients:
                _run_ws_clients.pop(run_id, None)


@router.get("/results/{run_id}", response_model=ResultsResponse)
@limiter.limit("30/minute")
async def list_results(request: Request, run_id: str):
    path = _result_directory(run_id)
    if not path.exists() or not path.is_dir():
        raise HTTPException(status_code=404, detail="Results not found")
    if simulation_state["running"] and run_id == simulation_state["run_id"]:
        raise HTTPException(status_code=409, detail="Simulation is still running")
    if read_run_metadata(path).get("outcome") not in COMPLETED_OUTCOMES:
        raise HTTPException(status_code=404, detail="No completed results for this run")

    files = [
        ResultFile(filename=filename, url=_result_file_url(run_id, filename))
        for filename in public_result_files(path)
    ]
    data, data_error = read_chart_data(
        path,
        run_id,
        on_error=lambda: log.warning(
            "Cannot read chart data for run_id=%s", run_id, exc_info=True
        ),
    )
    return ResultsResponse(files=files, run_id=run_id, data=data, data_error=data_error)


@router.get("/results/{run_id}/files/{filename}")
@limiter.limit("30/minute")
async def get_result_file(request: Request, run_id: str, filename: str):
    """Serve one allowlisted artifact after the same access check as the API."""
    return FileResponse(_result_file_path(run_id, filename))


@router.delete(
    "/results/{run_id}",
    dependencies=[Depends(require_roles("admin", "operator"))],
)
@limiter.limit("10/minute")
async def delete_results(request: Request, run_id: str):
    path = _result_directory(run_id)
    with _sim_lock:
        if simulation_state["running"] and run_id == simulation_state["run_id"]:
            raise HTTPException(
                status_code=409, detail="Cannot delete results of a running simulation"
            )
        if any(queued_run.run_id == run_id for queued_run in _run_queue):
            raise HTTPException(
                status_code=409, detail="Cannot delete results of a queued simulation"
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


def _launch_worker(input_path: Path, result_path: Path, progress_path: Path) -> Any:
    return launch_worker(
        input_path,
        result_path,
        progress_path,
        base_dir=get_settings().base_dir,
    )


def _run_with_state(scenario_raw: dict, params: dict) -> None:
    import traceback

    run_id = (
        params.get("run_id")
        or (
            f"{params['map_name']}_{params['current_time']}"
            if params.get("map_name") and params.get("current_time")
            else None
        )
        or simulation_state.get("run_id")
    )
    if not isinstance(run_id, str) or not run_id:
        raise ValueError("Simulation run ID is required")
    metadata = {
        "outcome": "running",
        "map": params.get("map_name"),
        "scenario_id": scenario_raw.get("scenario_id"),
        "scenario_name": scenario_raw.get("scenario_name"),
        "max_ticks": params.get("max_ticks", 0),
        "tick": 0,
    }

    def progress(tick: int, maximum: int) -> None:
        with _sim_lock:
            simulation_state.update(tick=tick, max_ticks=maximum)
        _broadcast_state()

    worker_input: Path | None = None
    worker_result: Path | None = None
    worker_progress: Path | None = None
    try:
        write_run_metadata(run_id, metadata)
        run_directory = _result_directory(run_id)
        worker_input = run_directory / "worker_input.json"
        worker_result = run_directory / "worker_result.json"
        worker_progress = run_directory / "worker_progress.json"
        worker_input.write_text(
            json.dumps({"scenario_raw": scenario_raw, "params": params}),
            encoding="utf-8",
        )
        worker = _launch_worker(worker_input, worker_result, worker_progress)
        write_run_metadata(run_id, {**metadata, "worker_pid": worker.pid})
        global _active_worker
        with _active_worker_lock:
            _active_worker = worker
        worker_started_at = time.monotonic()
        settings = get_settings()
        while worker.poll() is None:
            if (
                time.monotonic() - worker_started_at
                > settings.simulation_max_runtime_seconds
            ):
                log.error(
                    "Worker pid=%s exceeded %.0fs runtime limit",
                    worker.pid,
                    settings.simulation_max_runtime_seconds,
                )
                stop_worker(worker, grace_seconds=0)
                raise RuntimeError("Simulation exceeded the configured maximum runtime")
            if worker_progress.exists():
                try:
                    latest_progress = json.loads(
                        worker_progress.read_text(encoding="utf-8")
                    )
                    progress(latest_progress["tick"], latest_progress["max_ticks"])
                except (OSError, ValueError, KeyError, TypeError):
                    pass
            time.sleep(0.25)
        with _active_worker_lock:
            _active_worker = None
        if not worker_result.exists():
            raise RuntimeError(
                f"Simulation worker exited with code {worker.returncode}"
            )
        worker_payload = json.loads(worker_result.read_text(encoding="utf-8"))
        if "error" in worker_payload:
            with _sim_lock:
                was_stopped = simulation_state["status"] == "stopping"
                stopped_tick = simulation_state["tick"]
            if not was_stopped:
                raise RuntimeError(worker_payload["error"])
            result = {
                "tick": stopped_tick,
                "max_ticks": params.get("max_ticks", 0),
                "partial": True,
            }
        else:
            result = worker_payload.get("result")
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
        _update_run_record(run_id, "partial" if partial else "complete")
    except Exception as e:
        _update_run_record(run_id, "failed", str(e))
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
        for internal_file in (worker_input, worker_result, worker_progress):
            if internal_file is None:
                continue
            try:
                internal_file.unlink(missing_ok=True)
            except OSError:
                log.warning("Could not remove internal worker file: %s", internal_file)
        with _active_worker_lock:
            _active_worker = None
        with _sim_lock:
            simulation_state["running"] = False
            if simulation_state["status"] == "stopping":
                simulation_state["status"] = "idle"
        _broadcast_state()
        _schedule_next_run()


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
                    ) or any(
                        queued_run.run_id == entry.name for queued_run in _run_queue
                    ):
                        continue
                    shutil.rmtree(entry)
                    log.info("Auto-cleaned old results: %s", entry.name)
