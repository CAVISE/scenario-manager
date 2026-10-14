"""Database-backed worker that executes queued simulation runs sequentially."""

import signal
import threading
from collections.abc import Callable

from app.config import Settings, get_settings
from app.database import SessionLocal, engine, initialize_database
from app.log_config import get_logger
from app.run_results import read_run_metadata, write_run_metadata
from app.services.simulation.execution import SimulationWorkerExecutor
from app.services.simulation.lifecycle import RunLifecycleService
from app.services.simulation.repository import SimulationRunRepository
from app.services.simulation.results import result_directory
from app.services.simulation.worker_lease import SimulationWorkerLease
from app.services.simulation.worker import launch_worker, stop_worker

log = get_logger(__name__)


class DatabaseSimulationWorker:
    """Claim durable jobs and execute one CARLA run at a time."""

    def __init__(
        self,
        lifecycle: RunLifecycleService,
        settings_factory: Callable[[], Settings] = get_settings,
    ) -> None:
        self._lifecycle = lifecycle
        self._settings_factory = settings_factory
        self._shutdown = threading.Event()
        self._executor = SimulationWorkerExecutor(
            run_directory=lambda run_id: result_directory(
                self._settings_factory().eval_dir, run_id
            ),
            launch=lambda input_path, result_path, progress_path: launch_worker(
                input_path,
                result_path,
                progress_path,
                base_dir=self._settings_factory().base_dir,
            ),
            stop=stop_worker,
            max_runtime_seconds=lambda: (
                self._settings_factory().simulation_max_runtime_seconds
            ),
        )

    def run_forever(self) -> None:
        interrupted = self._lifecycle.recover_interrupted_runs()
        if interrupted:
            log.warning("Marked %d interrupted simulation runs as failed", interrupted)

        while not self._shutdown.is_set():
            if self.run_once():
                continue
            self._shutdown.wait(self._settings_factory().simulation_worker_poll_seconds)

    def shutdown(self) -> None:
        self._shutdown.set()

    def run_once(self) -> bool:
        queued_run = self._lifecycle.claim_next()
        if queued_run is None:
            return False

        run_id = queued_run.run_id
        metadata = {
            "outcome": "running",
            "map": queued_run.map_name,
            "scenario_id": queued_run.scenario_raw.get("scenario_id"),
            "scenario_name": queued_run.scenario_raw.get("scenario_name"),
            "max_ticks": queued_run.params.get("max_ticks", 0),
            "tick": 0,
        }
        write_run_metadata(run_id, metadata)

        def stopped_snapshot() -> tuple[bool, int]:
            record = self._lifecycle.get(run_id)
            run_metadata = read_run_metadata(
                result_directory(self._settings_factory().eval_dir, run_id)
            )
            return (
                record is not None and record.status == "stopping",
                int(run_metadata.get("tick", 0)),
            )

        def progress(tick: int, maximum: int) -> None:
            write_run_metadata(
                run_id,
                {**metadata, "outcome": "running", "tick": tick, "max_ticks": maximum},
            )

        try:
            result = self._executor.execute(
                run_id,
                queued_run.scenario_raw,
                queued_run.params,
                on_started=lambda pid: write_run_metadata(
                    run_id, {**metadata, "worker_pid": pid}
                ),
                on_progress=progress,
                stopped_snapshot=stopped_snapshot,
                stop_grace_seconds=self._settings_factory().simulation_stop_grace_seconds,
            )
            write_run_metadata(
                run_id,
                {
                    **metadata,
                    "outcome": "partial" if result.partial else "complete",
                    "tick": result.tick,
                    "max_ticks": result.max_ticks,
                },
            )
            if result.partial:
                self._lifecycle.mark_partial(run_id)
            else:
                self._lifecycle.mark_complete(run_id)
        except Exception as error:
            log.exception("Simulation run failed run_id=%s", run_id)
            self._lifecycle.mark_failed(run_id, str(error))
            write_run_metadata(
                run_id, {**metadata, "outcome": "failed", "error": str(error)}
            )
        return True


def main() -> None:
    initialize_database()
    lease = SimulationWorkerLease(engine)
    if not lease.acquire():
        log.error("Another simulation worker owns the CARLA execution lease; exiting")
        return

    try:
        worker = DatabaseSimulationWorker(
            RunLifecycleService(SimulationRunRepository(SessionLocal))
        )
        signal.signal(signal.SIGTERM, lambda _signum, _frame: worker.shutdown())
        signal.signal(signal.SIGINT, lambda _signum, _frame: worker.shutdown())
        worker.run_forever()
    finally:
        lease.release()


if __name__ == "__main__":
    main()
