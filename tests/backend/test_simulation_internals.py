import sys
import types
import shutil
import pytest
from datetime import datetime, timedelta
from pathlib import Path
from unittest.mock import MagicMock, patch

def test_normalize_known_map_case_insensitive():
    from app.routers.simulation import _normalize_map_name
    assert _normalize_map_name("town01") == "Town01"
    assert _normalize_map_name("TOWN10HD") == "Town10HD"
    assert _normalize_map_name("Town05") == "Town05"

def test_normalize_unknown_map_returns_as_is():
    from app.routers.simulation import _normalize_map_name
    assert _normalize_map_name("MyCustomMap") == "MyCustomMap"
    assert _normalize_map_name("town99") == "town99"

def test_cleanup_removes_old_directories(tmp_path):
    from app.routers.simulation import cleanup_old_results

    old_dir = tmp_path / "old_run"
    old_dir.mkdir()
    new_dir = tmp_path / "new_run"
    new_dir.mkdir()

    old_time = (datetime.now() - timedelta(days=10)).timestamp()
    import os
    os.utime(old_dir, (old_time, old_time))

    with patch("app.routers.simulation.get_settings") as mock_settings:
        mock_settings.return_value.eval_dir = tmp_path
        mock_settings.return_value.eval_retention_days = 7
        cleanup_old_results()

    assert not old_dir.exists()
    assert new_dir.exists()

def test_cleanup_skips_when_eval_dir_missing():
    from app.routers.simulation import cleanup_old_results

    with patch("app.routers.simulation.get_settings") as mock_settings:
        mock_settings.return_value.eval_dir = Path("/nonexistent/path")
        mock_settings.return_value.eval_retention_days = 7
        cleanup_old_results()

def test_cleanup_ignores_files_not_dirs(tmp_path):
    from app.routers.simulation import cleanup_old_results

    old_file = tmp_path / "old_file.txt"
    old_file.write_text("data")

    old_time = (datetime.now() - timedelta(days=10)).timestamp()
    import os
    os.utime(old_file, (old_time, old_time))

    with patch("app.routers.simulation.get_settings") as mock_settings:
        mock_settings.return_value.eval_dir = tmp_path
        mock_settings.return_value.eval_retention_days = 7
        cleanup_old_results()

    assert old_file.exists()

@pytest.fixture(autouse=True)
def reset_state():
    from app.routers.simulation import simulation_state, _ws_clients
    simulation_state.update({
        "running": True,
        "status": "running",
        "error": None,
        "map": "Town01",
        "run_id": "Town01_123",
    })
    _ws_clients.clear()
    yield
    simulation_state.update({
        "running": False,
        "status": "idle",
        "error": None,
        "map": None,
        "run_id": None,
    })

def test_run_with_state_sets_finished_on_success():
    from app.routers.simulation import _run_with_state, simulation_state

    fake_runner = types.ModuleType("app.runner")
    fake_runner.run_scenario = MagicMock()

    with patch.dict(sys.modules, {"app.runner": fake_runner}), \
         patch("app.routers.simulation._broadcast_state"):
        _run_with_state({}, {"map_name": "Town01", "max_ticks": 100})

    assert simulation_state["status"] == "finished"
    assert simulation_state["running"] is False


def test_run_with_state_sets_error_on_exception():
    from app.routers.simulation import _run_with_state, simulation_state

    fake_runner = types.ModuleType("app.runner")
    fake_runner.run_scenario = MagicMock(side_effect=RuntimeError("CARLA crashed"))

    with patch.dict(sys.modules, {"app.runner": fake_runner}), \
         patch("app.routers.simulation._broadcast_state"):
        _run_with_state({}, {"map_name": "Town01", "max_ticks": 100})

    assert simulation_state["status"] == "error"
    assert simulation_state["error"] == "CARLA crashed"
    assert simulation_state["running"] is False

def test_run_with_state_status_is_error_even_when_was_stopping():
    from app.routers.simulation import _run_with_state, simulation_state

    simulation_state["status"] = "stopping"

    fake_runner = types.ModuleType("app.runner")
    fake_runner.run_scenario = MagicMock(side_effect=RuntimeError("stopped"))

    with patch.dict(sys.modules, {"app.runner": fake_runner}), \
         patch("app.routers.simulation._broadcast_state"):
        _run_with_state({}, {"map_name": "Town01", "max_ticks": 100})

    assert simulation_state["status"] == "error"
    assert simulation_state["error"] == "stopped"
    assert simulation_state["running"] is False

def test_run_with_state_calls_broadcast():
    from app.routers.simulation import _run_with_state

    fake_runner = types.ModuleType("app.runner")
    fake_runner.run_scenario = MagicMock()

    with patch.dict(sys.modules, {"app.runner": fake_runner}), \
         patch("app.routers.simulation._broadcast_state") as mock_broadcast:
        _run_with_state({}, {})

    mock_broadcast.assert_called_once()