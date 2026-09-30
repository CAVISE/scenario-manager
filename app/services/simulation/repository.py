import json
from collections.abc import Callable

from sqlalchemy.orm import Session

from app.models import SimulationRun
from app.services.simulation.contracts import QueuedSimulation


class SimulationRunRepository:
    """Persistence boundary for durable simulation queue records."""

    def __init__(self, session_factory: Callable[[], Session]) -> None:
        self._session_factory = session_factory

    def save(self, queued_run: QueuedSimulation, status: str = "queued") -> None:
        with self._session_factory() as session:
            session.merge(
                SimulationRun(
                    run_id=queued_run.run_id,
                    status=status,
                    map_name=queued_run.map_name,
                    scenario_id=queued_run.scenario_raw.get("scenario_id"),
                    scenario_name=queued_run.scenario_raw.get("scenario_name"),
                    scenario_raw=json.dumps(queued_run.scenario_raw),
                    params=json.dumps(queued_run.params),
                )
            )
            session.commit()

    def update(self, run_id: str, status: str, error: str | None = None) -> None:
        with self._session_factory() as session:
            record = session.get(SimulationRun, run_id)
            if record is None:
                return
            record.status = status
            record.error = error
            session.commit()

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
            session.commit()

        return [
            QueuedSimulation(
                run_id=record.run_id,
                map_name=record.map_name,
                scenario_raw=json.loads(record.scenario_raw),
                params=json.loads(record.params),
            )
            for record in queued_records
        ]
