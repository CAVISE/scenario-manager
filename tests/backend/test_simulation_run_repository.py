from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.models import Base, SimulationRun
from app.services.simulation.contracts import QueuedSimulation, RunStatus
from app.services.simulation.repository import SimulationRunRepository


def _repository() -> tuple[SimulationRunRepository, sessionmaker]:
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    session_factory = sessionmaker(bind=engine)
    return SimulationRunRepository(session_factory), session_factory


def _queued_run(run_id: str = "Town03_repository") -> QueuedSimulation:
    return QueuedSimulation(
        run_id=run_id,
        map_name="Town03",
        scenario_raw={"scenario_id": "repository-contract"},
        params={"max_ticks": 100},
    )


def test_repository_persists_only_legal_run_status_transitions():
    repository, session_factory = _repository()
    run = _queued_run()
    repository.save(run)

    assert repository.transition(run.run_id, RunStatus.RUNNING)
    assert not repository.transition(run.run_id, RunStatus.QUEUED)
    assert repository.transition(run.run_id, RunStatus.COMPLETE)
    assert not repository.transition(run.run_id, RunStatus.FAILED, "too late")

    with session_factory() as session:
        record = session.get(SimulationRun, run.run_id)
        assert record is not None
        assert record.status == RunStatus.COMPLETE
        assert record.error is None


def test_repository_recovery_fails_interrupted_runs_and_restores_queue():
    repository, session_factory = _repository()
    queued = _queued_run("Town03_queued")
    running = _queued_run("Town03_running")
    stopping = _queued_run("Town03_stopping")
    repository.save(queued)
    repository.save(running)
    repository.save(stopping)
    assert repository.transition(running.run_id, RunStatus.RUNNING)
    assert repository.transition(stopping.run_id, RunStatus.RUNNING)
    assert repository.transition(stopping.run_id, RunStatus.STOPPING)

    recovered = repository.recover_queue()

    assert recovered == [queued]
    with session_factory() as session:
        interrupted = session.get(SimulationRun, running.run_id)
        stopped = session.get(SimulationRun, stopping.run_id)
        assert interrupted is not None
        assert stopped is not None
        assert interrupted.status == RunStatus.FAILED
        assert stopped.status == RunStatus.FAILED
        assert interrupted.error == "Backend restarted while this run was active"
        assert stopped.error == "Backend restarted while this run was active"


def test_repository_claims_queued_runs_once_and_reports_remaining_position():
    repository, session_factory = _repository()
    first = _queued_run("Town03_001")
    second = _queued_run("Town03_002")
    repository.save(first)
    repository.save(second)

    claimed = repository.claim_next()

    assert claimed == first
    assert repository.queue_position(first.run_id) is None
    assert repository.queue_position(second.run_id) == 1
    with session_factory() as session:
        record = session.get(SimulationRun, first.run_id)
        assert record is not None
        assert record.status == RunStatus.RUNNING
