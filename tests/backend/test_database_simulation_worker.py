from pathlib import Path
from types import SimpleNamespace

from app.run_worker import DatabaseSimulationWorker
from app.services.simulation.contracts import QueuedSimulation
from app.services.simulation.execution import ExecutionResult


class _LifecycleSpy:
    def __init__(self, queued_run: QueuedSimulation) -> None:
        self.queued_run = queued_run
        self.completed: list[str] = []
        self.partial: list[str] = []
        self.failed: list[tuple[str, str]] = []

    def claim_next(self):
        queued_run, self.queued_run = self.queued_run, None  # type: ignore[assignment]
        return queued_run

    def get(self, _run_id):
        return SimpleNamespace(status="running")

    def mark_complete(self, run_id):
        self.completed.append(run_id)
        return True

    def mark_partial(self, run_id):
        self.partial.append(run_id)
        return True

    def mark_failed(self, run_id, error):
        self.failed.append((run_id, error))
        return True


class _ExecutorStub:
    def __init__(self, result: ExecutionResult) -> None:
        self.result = result
        self.calls: list[str] = []

    def execute(self, run_id, *_args, **_kwargs):
        self.calls.append(run_id)
        return self.result


def _settings(root: Path):
    return SimpleNamespace(
        eval_dir=root,
        base_dir=root,
        simulation_max_runtime_seconds=10,
        simulation_stop_grace_seconds=1,
        simulation_worker_poll_seconds=0.01,
    )


def test_database_worker_claims_and_completes_one_run(monkeypatch, tmp_path):
    from app import run_results

    settings = _settings(tmp_path)
    monkeypatch.setattr(run_results, "get_settings", lambda: settings)
    run = QueuedSimulation(
        run_id="Town03_worker",
        map_name="Town03",
        scenario_raw={"scenario_id": "worker-contract"},
        params={"max_ticks": 12},
    )
    lifecycle = _LifecycleSpy(run)
    worker = DatabaseSimulationWorker(lifecycle, settings_factory=lambda: settings)
    executor = _ExecutorStub(ExecutionResult(tick=12, max_ticks=12, partial=False))
    worker._executor = executor  # type: ignore[assignment]

    assert worker.run_once()
    assert not worker.run_once()
    assert executor.calls == [run.run_id]
    assert lifecycle.completed == [run.run_id]
    assert lifecycle.partial == []
    assert lifecycle.failed == []
    assert (tmp_path / run.run_id / "run_status.json").is_file()
