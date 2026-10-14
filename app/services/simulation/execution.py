"""Infrastructure service for one isolated simulation worker process."""

import json
import threading
import time
from collections.abc import Callable
from dataclasses import dataclass
from pathlib import Path
from typing import Protocol


class WorkerProcess(Protocol):
    """Minimal process surface needed by the execution monitor."""

    pid: int
    returncode: int | None

    def poll(self) -> int | None: ...


@dataclass(frozen=True)
class ExecutionResult:
    tick: int
    max_ticks: int
    partial: bool


class SimulationWorkerExecutor:
    """Run and monitor a simulation in a child process.

    The class deliberately has no dependency on FastAPI, database records, or
    in-memory application state. The orchestration layer supplies callbacks for
    progress and cancellation, which makes this transport replaceable by a
    broker-backed worker later without changing HTTP endpoints.
    """

    def __init__(
        self,
        *,
        run_directory: Callable[[str], Path],
        launch: Callable[[Path, Path, Path], WorkerProcess],
        stop: Callable[[WorkerProcess, float], None],
        max_runtime_seconds: Callable[[], float],
        poll_interval_seconds: float = 0.25,
    ) -> None:
        self._run_directory = run_directory
        self._launch = launch
        self._stop = stop
        self._max_runtime_seconds = max_runtime_seconds
        self._poll_interval_seconds = poll_interval_seconds
        self._active_worker: WorkerProcess | None = None
        self._active_worker_lock = threading.Lock()

    def request_stop(self, grace_seconds: float) -> None:
        """Stop the active child without blocking the API request thread."""
        with self._active_worker_lock:
            worker = self._active_worker
        if worker is None or worker.poll() is not None:
            return

        threading.Thread(
            target=self._stop,
            args=(worker, grace_seconds),
            name="simulation-stop",
            daemon=True,
        ).start()

    def execute(
        self,
        run_id: str,
        scenario_raw: dict,
        params: dict,
        *,
        on_started: Callable[[int], None],
        on_progress: Callable[[int, int], None],
        stopped_snapshot: Callable[[], tuple[bool, int]],
        stop_grace_seconds: float = 20.0,
    ) -> ExecutionResult:
        """Execute the child process and return its terminal outcome.

        Worker failures are raised to the orchestration layer; it decides how
        they map to durable run state and user-facing metadata.
        """
        run_directory = self._run_directory(run_id)
        worker_input = run_directory / "worker_input.json"
        worker_result = run_directory / "worker_result.json"
        worker_progress = run_directory / "worker_progress.json"
        try:
            worker_input.write_text(
                json.dumps({"scenario_raw": scenario_raw, "params": params}),
                encoding="utf-8",
            )
            worker = self._launch(worker_input, worker_result, worker_progress)
            with self._active_worker_lock:
                self._active_worker = worker
            on_started(worker.pid)

            worker_started_at = time.monotonic()
            maximum_runtime = self._max_runtime_seconds()
            stop_requested = False
            while worker.poll() is None:
                if time.monotonic() - worker_started_at > maximum_runtime:
                    self._stop(worker, 0)
                    raise RuntimeError(
                        "Simulation exceeded the configured maximum runtime"
                    )
                was_stopped, _ = stopped_snapshot()
                if was_stopped and not stop_requested:
                    self._stop(worker, stop_grace_seconds)
                    stop_requested = True
                self._report_progress(worker_progress, on_progress)
                time.sleep(self._poll_interval_seconds)

            if not worker_result.exists():
                raise RuntimeError(
                    f"Simulation worker exited with code {worker.returncode}"
                )
            worker_payload = json.loads(worker_result.read_text(encoding="utf-8"))
            if "error" in worker_payload:
                was_stopped, stopped_tick = stopped_snapshot()
                if not was_stopped:
                    raise RuntimeError(str(worker_payload["error"]))
                return ExecutionResult(
                    tick=stopped_tick,
                    max_ticks=int(params.get("max_ticks", 0)),
                    partial=True,
                )

            outcome = worker_payload.get("result")
            if not isinstance(outcome, dict):
                outcome = {}
            was_stopped, _ = stopped_snapshot()
            return ExecutionResult(
                tick=int(outcome.get("tick", 0)),
                max_ticks=int(outcome.get("max_ticks", params.get("max_ticks", 0))),
                partial=bool(outcome.get("partial", was_stopped)),
            )
        finally:
            with self._active_worker_lock:
                self._active_worker = None
            for internal_file in (worker_input, worker_result, worker_progress):
                try:
                    internal_file.unlink(missing_ok=True)
                except OSError:
                    # Cleanup must not turn an otherwise completed run into a failure.
                    pass

    @staticmethod
    def _report_progress(
        worker_progress: Path, on_progress: Callable[[int, int], None]
    ) -> None:
        if not worker_progress.exists():
            return
        try:
            latest_progress = json.loads(worker_progress.read_text(encoding="utf-8"))
            on_progress(latest_progress["tick"], latest_progress["max_ticks"])
        except (OSError, ValueError, KeyError, TypeError):
            return
