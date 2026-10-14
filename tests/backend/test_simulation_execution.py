import json
from pathlib import Path

import pytest

from app.services.simulation.execution import SimulationWorkerExecutor


class _CompletedWorker:
    pid = 42
    returncode = 0

    def poll(self) -> int:
        return 0


def _executor(tmp_path: Path, launch):
    return SimulationWorkerExecutor(
        run_directory=lambda _run_id: tmp_path,
        launch=launch,
        stop=lambda _worker, _grace_seconds: None,
        max_runtime_seconds=lambda: 1,
        poll_interval_seconds=0,
    )


def test_executor_returns_worker_result_and_cleans_internal_files(tmp_path):
    started: list[int] = []
    progress: list[tuple[int, int]] = []
    input_payloads: list[dict] = []

    def launch(input_path, result_path, _progress_path):
        input_payloads.append(json.loads(input_path.read_text(encoding="utf-8")))
        result_path.write_text(
            json.dumps({"result": {"tick": 12, "max_ticks": 30}}),
            encoding="utf-8",
        )
        return _CompletedWorker()

    result = _executor(tmp_path, launch).execute(
        "Town03_execution",
        {"scenario_id": "execution-contract"},
        {"max_ticks": 30},
        on_started=started.append,
        on_progress=lambda tick, maximum: progress.append((tick, maximum)),
        stopped_snapshot=lambda: (False, 0),
    )

    assert result.tick == 12
    assert result.max_ticks == 30
    assert not result.partial
    assert started == [42]
    assert progress == []
    assert input_payloads == [
        {
            "scenario_raw": {"scenario_id": "execution-contract"},
            "params": {"max_ticks": 30},
        }
    ]
    assert not (tmp_path / "worker_input.json").exists()
    assert not (tmp_path / "worker_result.json").exists()


def test_executor_treats_stopped_worker_error_as_partial_result(tmp_path):
    def launch(_input_path, result_path, _progress_path):
        result_path.write_text(json.dumps({"error": "stopped"}), encoding="utf-8")
        return _CompletedWorker()

    result = _executor(tmp_path, launch).execute(
        "Town03_stopped",
        {},
        {"max_ticks": 30},
        on_started=lambda _pid: None,
        on_progress=lambda _tick, _maximum: None,
        stopped_snapshot=lambda: (True, 9),
    )

    assert result.tick == 9
    assert result.max_ticks == 30
    assert result.partial


def test_executor_surfaces_worker_errors_when_run_is_not_stopping(tmp_path):
    def launch(_input_path, result_path, _progress_path):
        result_path.write_text(
            json.dumps({"error": "CARLA disconnected"}), encoding="utf-8"
        )
        return _CompletedWorker()

    with pytest.raises(RuntimeError, match="CARLA disconnected"):
        _executor(tmp_path, launch).execute(
            "Town03_error",
            {},
            {},
            on_started=lambda _pid: None,
            on_progress=lambda _tick, _maximum: None,
            stopped_snapshot=lambda: (False, 0),
        )
