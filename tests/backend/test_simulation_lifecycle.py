from app.services.simulation.contracts import QueuedSimulation, RunStatus
from app.services.simulation.lifecycle import RunLifecycleService


class _RepositorySpy:
    def __init__(self) -> None:
        self.saved: list[tuple[QueuedSimulation, RunStatus]] = []
        self.transitions: list[tuple[str, RunStatus, str | None]] = []

    def save(self, run: QueuedSimulation, status: RunStatus) -> None:
        self.saved.append((run, status))

    def transition(
        self, run_id: str, status: RunStatus, error: str | None = None
    ) -> bool:
        self.transitions.append((run_id, status, error))
        return True


def test_lifecycle_service_maps_commands_to_persistent_state_transitions():
    repository = _RepositorySpy()
    service = RunLifecycleService(repository)  # type: ignore[arg-type]
    run = QueuedSimulation(
        run_id="Town03_contract",
        map_name="Town03",
        scenario_raw={},
        params={},
    )

    service.enqueue(run)
    service.mark_running(run.run_id)
    service.mark_stopping(run.run_id)
    service.mark_partial(run.run_id)

    assert repository.saved == [(run, RunStatus.QUEUED)]
    assert repository.transitions == [
        (run.run_id, RunStatus.RUNNING, None),
        (run.run_id, RunStatus.STOPPING, None),
        (run.run_id, RunStatus.PARTIAL, None),
    ]


def test_lifecycle_service_persists_failure_context():
    repository = _RepositorySpy()
    service = RunLifecycleService(repository)  # type: ignore[arg-type]

    service.mark_failed("Town03_contract", "CARLA disconnected")

    assert repository.transitions == [
        ("Town03_contract", RunStatus.FAILED, "CARLA disconnected")
    ]
