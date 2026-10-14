"""Temporary compatibility path for the retired in-process simulation runner."""

import traceback
from collections.abc import Callable
from pathlib import Path

from app.services.simulation.execution import SimulationWorkerExecutor, WorkerProcess


class LegacySimulationExecutor:
    """Run the former in-process flow without coupling it to HTTP routing.

    New runs are executed by :mod:`app.run_worker`. This class exists only for
    a short rolling-deployment compatibility window and keeps that deprecated
    behaviour out of the API router.
    """

    def __init__(
        self,
        *,
        state: dict,
        state_lock,
        run_directory: Callable[[str], Path],
        launch: Callable[[Path, Path, Path], WorkerProcess],
        stop: Callable[[WorkerProcess, float], None],
        max_runtime_seconds: Callable[[], float],
        write_metadata: Callable[[str | None, dict], None],
        update_run_record: Callable[[str, str, str | None], None],
        broadcast: Callable[[], None],
        logger,
    ) -> None:
        self._state = state
        self._state_lock = state_lock
        self._write_metadata = write_metadata
        self._update_run_record = update_run_record
        self._broadcast = broadcast
        self._log = logger
        self._executor = SimulationWorkerExecutor(
            run_directory=run_directory,
            launch=launch,
            stop=stop,
            max_runtime_seconds=max_runtime_seconds,
        )

    def execute(self, scenario_raw: dict, params: dict) -> None:
        run_id = self._run_id(params)
        metadata = {
            "outcome": "running",
            "map": params.get("map_name"),
            "scenario_id": scenario_raw.get("scenario_id"),
            "scenario_name": scenario_raw.get("scenario_name"),
            "max_ticks": params.get("max_ticks", 0),
            "tick": 0,
        }

        def progress(tick: int, maximum: int) -> None:
            with self._state_lock:
                self._state.update(tick=tick, max_ticks=maximum)
            self._broadcast()

        try:
            self._write_metadata(run_id, metadata)
            result = self._executor.execute(
                run_id,
                scenario_raw,
                params,
                on_started=lambda worker_pid: self._write_metadata(
                    run_id, {**metadata, "worker_pid": worker_pid}
                ),
                on_progress=progress,
                stopped_snapshot=self._stopped_snapshot,
            )
            with self._state_lock:
                self._state.update(
                    tick=result.tick,
                    max_ticks=result.max_ticks,
                    partial=result.partial,
                    status="finished",
                )
                tick = self._state["tick"]
            self._write_metadata(
                run_id,
                {
                    **metadata,
                    "outcome": "partial" if result.partial else "complete",
                    "tick": tick,
                },
            )
            self._update_run_record(
                run_id, "partial" if result.partial else "complete", None
            )
        except Exception as error:
            self._update_run_record(run_id, "failed", str(error))
            try:
                self._write_metadata(
                    run_id, {**metadata, "outcome": "failed", "error": str(error)}
                )
            except OSError:
                self._log.exception("Failed to persist legacy run failure")
            with self._state_lock:
                self._state.update(
                    status="error",
                    error=str(error),
                    run_id=None,
                    partial=False,
                )
            self._log.error("Legacy simulation error:\n%s", traceback.format_exc())
        finally:
            with self._state_lock:
                self._state["running"] = False
                if self._state["status"] == "stopping":
                    self._state["status"] = "idle"
            self._broadcast()

    def _run_id(self, params: dict) -> str:
        run_id = (
            params.get("run_id")
            or (
                f"{params['map_name']}_{params['current_time']}"
                if params.get("map_name") and params.get("current_time")
                else None
            )
            or self._state.get("run_id")
        )
        if not isinstance(run_id, str) or not run_id:
            raise ValueError("Simulation run ID is required")
        return run_id

    def _stopped_snapshot(self) -> tuple[bool, int]:
        with self._state_lock:
            return self._state["status"] == "stopping", self._state["tick"]
