import json
from collections.abc import Callable

from sqlalchemy import func, select, tuple_
from sqlalchemy.orm import Session

from app.models import SimulationRun
from app.services.simulation.contracts import (
    QueuedSimulation,
    RunStatus,
    can_transition_run_status,
)


class SimulationRunRepository:
    """Persistence boundary for durable simulation queue records."""

    def __init__(self, session_factory: Callable[[], Session]) -> None:
        self._session_factory = session_factory

    def save(
        self, queued_run: QueuedSimulation, status: RunStatus | str = RunStatus.QUEUED
    ) -> None:
        with self._session_factory() as session:
            session.merge(
                SimulationRun(
                    run_id=queued_run.run_id,
                    status=str(status),
                    map_name=queued_run.map_name,
                    scenario_id=queued_run.scenario_raw.get("scenario_id"),
                    scenario_name=queued_run.scenario_raw.get("scenario_name"),
                    scenario_raw=json.dumps(queued_run.scenario_raw),
                    params=json.dumps(queued_run.params),
                )
            )
            session.commit()

    def transition(
        self, run_id: str, status: RunStatus | str, error: str | None = None
    ) -> bool:
        """Persist a legal state transition under a row lock.

        The lock makes competing API workers observe one current state before
        they attempt a transition. It is a foundation for moving scheduling out
        of the web process without changing the current API contract.
        """
        target = str(status)
        with self._session_factory() as session:
            record = session.get(SimulationRun, run_id, with_for_update=True)
            if record is None:
                return False
            if not can_transition_run_status(record.status, target):
                return False
            record.status = target
            record.error = error
            session.commit()
            return True

    def update(
        self, run_id: str, status: RunStatus | str, error: str | None = None
    ) -> bool:
        """Backward-compatible alias for callers during the orchestration move."""
        return self.transition(run_id, status, error)

    def get(self, run_id: str) -> SimulationRun | None:
        with self._session_factory() as session:
            return session.get(SimulationRun, run_id)

    def list_all(self) -> list[SimulationRun]:
        with self._session_factory() as session:
            return (
                session.query(SimulationRun)
                .order_by(SimulationRun.updated_at.desc())
                .all()
            )

    def claim_next(self) -> QueuedSimulation | None:
        """Atomically reserve the oldest queued run for one worker.

        PostgreSQL's ``SKIP LOCKED`` lets several worker processes compete
        without waiting on one another or executing the same run twice.
        """
        with self._session_factory() as session:
            record = session.scalar(
                select(SimulationRun)
                .where(SimulationRun.status == RunStatus.QUEUED)
                .order_by(SimulationRun.created_at, SimulationRun.run_id)
                .limit(1)
                .with_for_update(skip_locked=True)
            )
            if record is None:
                return None
            record.status = str(RunStatus.RUNNING)
            record.error = None
            claimed_run = self._queued_simulation(record)
            session.commit()
            return claimed_run

    def queue_position(self, run_id: str) -> int | None:
        """Return the one-based queue position for an unclaimed run."""
        with self._session_factory() as session:
            record = session.get(SimulationRun, run_id)
            if record is None or record.status != RunStatus.QUEUED:
                return None
            earlier_count = session.scalar(
                select(func.count())
                .select_from(SimulationRun)
                .where(
                    SimulationRun.status == RunStatus.QUEUED,
                    tuple_(SimulationRun.created_at, SimulationRun.run_id)
                    <= tuple_(record.created_at, record.run_id),
                )
            )
            return int(earlier_count or 0)

    def recover_interrupted_runs(self) -> int:
        """Fail runs that were owned by a worker which has exited."""
        with self._session_factory() as session:
            interrupted = session.query(SimulationRun).filter(
                SimulationRun.status.in_((RunStatus.RUNNING, RunStatus.STOPPING))
            )
            count = 0
            for record in interrupted:
                record.status = str(RunStatus.FAILED)
                record.error = "Simulation worker restarted while this run was active"
                count += 1
            session.commit()
            return count

    def recover_queue(self) -> list[QueuedSimulation]:
        """Mark interrupted runs and return records which are safe to resume."""
        with self._session_factory() as session:
            interrupted = session.query(SimulationRun).filter(
                SimulationRun.status.in_(("running", "stopping"))
            )
            for record in interrupted:
                record.status = "failed"
                record.error = "Backend restarted while this run was active"
            queued_records = (
                session.query(SimulationRun)
                .filter(SimulationRun.status == "queued")
                .order_by(SimulationRun.created_at)
                .all()
            )
            queued_runs = [self._queued_simulation(record) for record in queued_records]
            session.commit()

        return queued_runs

    @staticmethod
    def _queued_simulation(record: SimulationRun) -> QueuedSimulation:
        return QueuedSimulation(
            run_id=record.run_id,
            map_name=record.map_name,
            scenario_raw=json.loads(record.scenario_raw),
            params=json.loads(record.params),
        )
