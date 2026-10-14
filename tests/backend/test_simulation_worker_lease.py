from types import SimpleNamespace

import pytest

from app.services.simulation.worker_lease import SimulationWorkerLease


class _Connection:
    def __init__(self, *, dialect: str = "postgresql", acquired: bool = True) -> None:
        self.dialect = SimpleNamespace(name=dialect)
        self.acquired = acquired
        self.closed = False
        self.scalar_calls: list[tuple[str, dict]] = []
        self.execute_calls: list[tuple[str, dict]] = []

    def scalar(self, statement, params):
        self.scalar_calls.append((str(statement), params))
        return self.acquired

    def execute(self, statement, params):
        self.execute_calls.append((str(statement), params))

    def close(self):
        self.closed = True


class _Engine:
    def __init__(self, connection: _Connection) -> None:
        self.connection = connection

    def connect(self):
        return self.connection


def test_worker_lease_holds_postgres_lock_until_graceful_release():
    connection = _Connection()
    lease = SimulationWorkerLease(_Engine(connection))  # type: ignore[arg-type]

    assert lease.acquire()
    assert "pg_try_advisory_lock" in connection.scalar_calls[0][0]
    assert not connection.closed

    lease.release()

    assert "pg_advisory_unlock" in connection.execute_calls[0][0]
    assert connection.closed


def test_worker_lease_releases_connection_when_another_worker_owns_it():
    connection = _Connection(acquired=False)
    lease = SimulationWorkerLease(_Engine(connection))  # type: ignore[arg-type]

    assert not lease.acquire()
    assert connection.closed


def test_worker_lease_rejects_non_postgres_runtime():
    connection = _Connection(dialect="sqlite")
    lease = SimulationWorkerLease(_Engine(connection))  # type: ignore[arg-type]

    with pytest.raises(RuntimeError, match="PostgreSQL"):
        lease.acquire()
    assert connection.closed


def test_worker_main_exits_without_starting_when_lease_is_held(monkeypatch):
    from app import run_worker

    calls: list[str] = []

    class _HeldLease:
        def __init__(self, _engine) -> None:
            pass

        def acquire(self):
            return False

        def release(self):
            calls.append("released")

    monkeypatch.setattr(run_worker, "initialize_database", lambda: calls.append("db"))
    monkeypatch.setattr(run_worker, "SimulationWorkerLease", _HeldLease)

    run_worker.main()

    assert calls == ["db"]
