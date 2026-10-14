"""Process-wide ownership guard for a CARLA simulation worker."""

from sqlalchemy import text
from sqlalchemy.engine import Connection, Engine


# This value is only a namespace for PostgreSQL advisory locks. It has no
# business meaning, but must stay stable across worker deployments.
SIMULATION_WORKER_LOCK_KEY = 8_730_215_001


class SimulationWorkerLease:
    """Hold an exclusive PostgreSQL advisory lock for one worker process.

    The connection deliberately remains open for the worker lifetime: PostgreSQL
    releases session-level advisory locks when either the process or connection
    disappears. This prevents an accidentally scaled Compose service from
    running multiple jobs against the same CARLA endpoint.
    """

    def __init__(self, engine: Engine) -> None:
        self._engine = engine
        self._connection: Connection | None = None

    def acquire(self) -> bool:
        """Acquire the lease without waiting; return False when it is held."""
        if self._connection is not None:
            return True

        connection = self._engine.connect()
        try:
            if connection.dialect.name != "postgresql":
                raise RuntimeError("Simulation worker requires PostgreSQL")
            acquired = connection.scalar(
                text("SELECT pg_try_advisory_lock(:lock_key)"),
                {"lock_key": SIMULATION_WORKER_LOCK_KEY},
            )
            if not acquired:
                connection.close()
                return False
            self._connection = connection
            return True
        except Exception:
            connection.close()
            raise

    def release(self) -> None:
        """Release the lock early during a graceful shutdown."""
        connection, self._connection = self._connection, None
        if connection is None:
            return
        try:
            connection.execute(
                text("SELECT pg_advisory_unlock(:lock_key)"),
                {"lock_key": SIMULATION_WORKER_LOCK_KEY},
            )
        finally:
            connection.close()
