import json
import threading
from datetime import datetime
from pathlib import Path
from typing import Any

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Request,
    WebSocket,
)
from pydantic import ValidationError
from sqlalchemy.exc import SQLAlchemyError

from app.auth import require_roles
from app.config import get_settings
from app.database import SessionLocal
from app.log_config import get_logger
from app.rate_limit import limiter
from app.run_results import read_run_metadata, write_run_metadata
from app.services.simulation.contracts import QueuedSimulation
from app.services.simulation.legacy_execution import LegacySimulationExecutor
from app.services.simulation.lifecycle import RunLifecycleService
from app.services.simulation.notifications import SimulationNotifier
from app.services.simulation.repository import SimulationRunRepository
from app.services.simulation.results import (
    ResultAccessError,
    cleanup_expired_result_directories,
    list_completed_runs,
    public_result_artifacts,
    result_directory,
    result_file_path,
)
from app.services.simulation.validation import preflight_entity_issues
from app.services.simulation.worker import launch_worker, stop_worker
from app.routers.simulation_results import add_result_routes
from app.schemas import (
    ResultRun,
    RunDetailResponse,
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

_run_repository = SimulationRunRepository(SessionLocal)
_notifier = SimulationNotifier(log)


def _run_lifecycle_service() -> RunLifecycleService:
    """Return a facade bound to the current repository configuration."""
    return RunLifecycleService(_run_repository)


def _save_run_record(queued_run: QueuedSimulation, status: str = "queued") -> None:
    if status != "queued":
        raise ValueError("New simulation runs must be created in the queued state")
    _run_lifecycle_service().enqueue(queued_run)


def _update_run_record(run_id: str, status: str, error: str | None = None) -> None:
    transitions = {
        "running": lambda: _run_lifecycle_service().mark_running(run_id),
        "stopping": lambda: _run_lifecycle_service().mark_stopping(run_id),
        "cancelled": lambda: _run_lifecycle_service().mark_cancelled(run_id),
        "complete": lambda: _run_lifecycle_service().mark_complete(run_id),
        "partial": lambda: _run_lifecycle_service().mark_partial(run_id),
        "failed": lambda: _run_lifecycle_service().mark_failed(
            run_id, error or "Unknown error"
        ),
    }
    transition = transitions.get(status)
    if transition is None:
        raise ValueError(f"Unsupported simulation run status: {status}")
    if not transition():
        log.warning(
            "Ignored invalid run status transition run_id=%s status=%s", run_id, status
        )


def _result_directory(run_id: str) -> Path:
    try:
        return result_directory(get_settings().eval_dir, run_id)
    except ResultAccessError as error:
        raise HTTPException(
            status_code=error.status_code, detail=error.detail
        ) from error


def _result_file_path(run_id: str, filename: str) -> Path:
    try:
        return result_file_path(get_settings().eval_dir, run_id, filename)
    except ResultAccessError as error:
        raise HTTPException(
            status_code=error.status_code, detail=error.detail
        ) from error


def _is_legacy_run_active(run_id: str) -> bool:
    with _sim_lock:
        return simulation_state["running"] and simulation_state["run_id"] == run_id


add_result_routes(
    router,
    result_directory=_result_directory,
    result_file_path=_result_file_path,
    get_run=lambda run_id: _run_lifecycle_service().get(run_id),
    is_legacy_run_active=_is_legacy_run_active,
)


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
    queue_position = None

    if current.get("run_id") == run_id:
        return SimulationRunResponse(**current)

    record = _run_lifecycle_service().get(run_id)
    if record is not None:
        status = _status_from_outcome(record.status)
        queue_position = _run_lifecycle_service().queue_position(run_id)
        metadata = read_run_metadata(_result_directory(run_id))
        try:
            max_ticks = int(json.loads(record.params).get("max_ticks", 0))
        except (TypeError, ValueError, json.JSONDecodeError):
            max_ticks = 0
        return SimulationRunResponse(
            running=status in {"running", "stopping"},
            status=status,
            error=record.error,
            map=record.map_name,
            run_id=record.run_id,
            tick=int(metadata.get("tick", 0)),
            max_ticks=int(metadata.get("max_ticks", max_ticks)),
            partial=record.status == "partial",
            scenario_id=record.scenario_id,
            scenario_name=record.scenario_name,
            modified_at=record.updated_at.timestamp(),
            queue_position=queue_position,
        )

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


def _current_status_response() -> SimulationStatusResponse:
    """Read current state from the durable queue, with legacy fallback."""
    try:
        active = next(
            (
                record
                for record in _run_lifecycle_service().list_all()
                if record.status in {"running", "stopping"}
            ),
            None,
        )
    except SQLAlchemyError:
        active = None
    if active is None:
        return SimulationStatusResponse(**simulation_state)
    return SimulationStatusResponse(**_run_response(active.run_id).model_dump())


@router.get("/results", response_model=list[ResultRun])
@limiter.limit("30/minute")
async def list_result_runs(request: Request):
    active_run_id = next(
        (
            record.run_id
            for record in _run_lifecycle_service().list_all()
            if record.status in {"running", "stopping"}
        ),
        None,
    )
    if active_run_id is None and simulation_state["running"]:
        active_run_id = simulation_state["run_id"]
    return list_completed_runs(get_settings().eval_dir, active_run_id=active_run_id)


def _broadcast_state() -> None:
    _notifier.broadcast(
        lambda: _current_status_response().model_dump(),
        lambda run_id: _run_response(run_id).model_dump(),
    )


def _start_simulation(
    body: StartSimulationRequest, *, allow_queue: bool = False
) -> StartSimulationResponse:
    settings = get_settings()

    if not allow_queue:
        active = next(
            (
                record
                for record in _run_lifecycle_service().list_all()
                if record.status in {"queued", "running", "stopping"}
            ),
            None,
        )
        with _sim_lock:
            legacy_running = simulation_state["running"]
        if active is not None or legacy_running:
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

        _save_run_record(queued_run)
    except HTTPException:
        raise
    except Exception:
        log.exception("start_opencda failed before the simulation task started")
        raise HTTPException(
            status_code=500,
            detail="Failed to start simulation; see server logs for details",
        )

    return StartSimulationResponse(
        status="queued",
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
    return _current_status_response()


@router.get("/v1/runs", response_model=list[SimulationRunResponse])
@limiter.limit("30/minute")
async def list_runs(request: Request):
    records = _run_lifecycle_service().list_all()
    if records:
        return [_run_response(record.run_id) for record in records]

    # Legacy directories created before durable queue records remain readable.
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


@router.get("/v1/runs/{run_id}/details", response_model=RunDetailResponse)
@limiter.limit("30/minute")
async def get_run_details(request: Request, run_id: str):
    run = _run_response(run_id)
    record = _run_lifecycle_service().get(run_id)
    configuration: dict[str, Any] = {}
    created_at = None
    if record is not None:
        try:
            configuration = json.loads(record.params)
        except json.JSONDecodeError:
            log.warning("Invalid stored run params for run_id=%s", run_id)
        created_at = record.created_at.timestamp()

    path = _result_directory(run_id)
    artifacts = public_result_artifacts(path, run_id) if path.is_dir() else []
    return RunDetailResponse(
        **run.model_dump(),
        created_at=created_at,
        configuration=configuration,
        artifacts=artifacts,
        has_results=path.is_dir(),
    )


def _stop_simulation(run_id: str | None = None) -> StopSimulationResponse:
    active = next(
        (
            record
            for record in _run_lifecycle_service().list_all()
            if record.status in {"running", "stopping"}
        ),
        None,
    )
    if active is None:
        # Compatibility for the legacy in-process runner during a rolling
        # deployment; normal production operation is database-backed.
        with _sim_lock:
            legacy_run_id = simulation_state["run_id"]
            legacy_running = simulation_state["running"]
            if legacy_running:
                simulation_state["status"] = "stopping"
        if not legacy_running:
            raise HTTPException(status_code=400, detail="No simulation running")
        return StopSimulationResponse(status="stopping", run_id=legacy_run_id)
    if run_id is not None and run_id != active.run_id:
        raise HTTPException(status_code=409, detail="Run is not active")
    if active.status == "running":
        _update_run_record(active.run_id, "stopping")
    try:
        existing = read_run_metadata(_result_directory(active.run_id))
        write_run_metadata(active.run_id, {**existing, "outcome": "stopping"})
    except (HTTPException, OSError, ValueError):
        log.warning("Could not persist stopping state for run=%s", active.run_id)
    return StopSimulationResponse(status="stopping", run_id=active.run_id)


def _cancel_queued_simulation(run_id: str) -> StopSimulationResponse:
    """Remove a waiting run without affecting the CARLA process in progress."""
    queued_run = _run_lifecycle_service().get(run_id)
    if queued_run is None or queued_run.status != "queued":
        raise HTTPException(status_code=409, detail="Run is not active or queued")
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
    run = _run_lifecycle_service().get(run_id)
    if run is not None and run.status in {"running", "stopping"}:
        return _stop_simulation(run_id)
    with _sim_lock:
        is_legacy_active = (
            simulation_state["running"] and simulation_state["run_id"] == run_id
        )
    if is_legacy_active:
        return _stop_simulation(run_id)
    return _cancel_queued_simulation(run_id)


@router.websocket("/v1/ws/runs/{run_id}")
async def ws_run(websocket: WebSocket, run_id: str):
    """Subscribe to the active run using the same payload as /v1/runs/{id}."""
    await _notifier.serve_run(
        websocket, run_id, lambda: _run_response(run_id).model_dump()
    )


@router.websocket("/ws/simulation")
async def ws_simulation(websocket: WebSocket):
    await _notifier.serve_state(
        websocket, lambda: _current_status_response().model_dump()
    )


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
    """Compatibility wrapper; new runs execute only in app.run_worker."""
    LegacySimulationExecutor(
        state=simulation_state,
        state_lock=_sim_lock,
        run_directory=_result_directory,
        launch=_launch_worker,
        stop=stop_worker,
        max_runtime_seconds=lambda: get_settings().simulation_max_runtime_seconds,
        write_metadata=write_run_metadata,
        update_run_record=_update_run_record,
        broadcast=_broadcast_state,
        logger=log,
    ).execute(scenario_raw, params)


def cleanup_old_results() -> None:
    settings = get_settings()
    with _sim_lock:
        protected_run_ids = (
            frozenset({simulation_state["run_id"]})
            if simulation_state["running"] and simulation_state["run_id"]
            else frozenset()
        )
    report = cleanup_expired_result_directories(
        settings.eval_dir,
        settings.eval_retention_days,
        protected_run_ids=protected_run_ids,
    )
    for run_id in report.deleted_run_ids:
        log.info("Auto-cleaned old results: %s", run_id)
    if report.inaccessible_run_ids:
        log.warning(
            "Skipped retention cleanup for %d result directories with inaccessible files",
            len(report.inaccessible_run_ids),
        )
