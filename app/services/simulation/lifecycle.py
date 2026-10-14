"""Application service for the durable lifecycle of simulation runs."""

from app.models import SimulationRun
from app.services.simulation.contracts import QueuedSimulation, RunStatus
from app.services.simulation.repository import SimulationRunRepository


class RunLifecycleService:
    """Own persistent run state independently from HTTP and worker transport.

    Process scheduling remains an infrastructure concern. This service is the
    single place through which that scheduler records intent and terminal
    outcomes, so it can later be used by a database-backed worker or broker.
    """

    def __init__(self, repository: SimulationRunRepository) -> None:
        self._repository = repository

    def enqueue(self, run: QueuedSimulation) -> None:
        self._repository.save(run, RunStatus.QUEUED)

    def mark_running(self, run_id: str) -> bool:
        return self._repository.transition(run_id, RunStatus.RUNNING)

    def mark_stopping(self, run_id: str) -> bool:
        return self._repository.transition(run_id, RunStatus.STOPPING)

    def mark_cancelled(self, run_id: str) -> bool:
        return self._repository.transition(run_id, RunStatus.CANCELLED)

    def mark_complete(self, run_id: str) -> bool:
        return self._repository.transition(run_id, RunStatus.COMPLETE)

    def mark_partial(self, run_id: str) -> bool:
        return self._repository.transition(run_id, RunStatus.PARTIAL)

    def mark_failed(self, run_id: str, error: str) -> bool:
        return self._repository.transition(run_id, RunStatus.FAILED, error)

    def recover_queue(self) -> list[QueuedSimulation]:
        return self._repository.recover_queue()

    def claim_next(self) -> QueuedSimulation | None:
        return self._repository.claim_next()

    def queue_position(self, run_id: str) -> int | None:
        return self._repository.queue_position(run_id)

    def recover_interrupted_runs(self) -> int:
        return self._repository.recover_interrupted_runs()

    def get(self, run_id: str) -> SimulationRun | None:
        return self._repository.get(run_id)

    def list_all(self) -> list[SimulationRun]:
        return self._repository.list_all()
