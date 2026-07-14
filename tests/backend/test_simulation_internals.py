import sys
import types
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


def test_v2x_search_uses_true_positions_and_rebuilds_nearby():
    import carla

    fake_numpy = types.SimpleNamespace(
        random=types.SimpleNamespace(
            normal=lambda *args, **kwargs: 0,
            randint=lambda *args, **kwargs: 0,
        ),
        linalg=types.SimpleNamespace(
            norm=lambda values: sum(v * v for v in values) ** 0.5,
        ),
        finfo=lambda _: types.SimpleNamespace(eps=0.0),
    )
    with patch.dict(sys.modules, {"numpy": fake_numpy}):
        from opencda.core.common.v2x_manager import V2XManager

        class FakeCavWorld:
            def __init__(self):
                self.global_clock = 0
                self._rsu_manager_dict = {}
                self.managers = {}

            def get_vehicle_managers(self):
                return self.managers

        def transform(x, y):
            return carla.Transform(carla.Location(x=x, y=y, z=0),
                                   carla.Rotation(yaw=0))

        cav_world = FakeCavWorld()
        cfg = {"enabled": True, "communication_range": 10}
        v2x_a = V2XManager(cav_world, cfg, "a")
        v2x_b = V2XManager(cav_world, cfg, "b")
        cav_world.managers = {
            "a": types.SimpleNamespace(v2x_manager=v2x_a),
            "b": types.SimpleNamespace(v2x_manager=v2x_b),
        }

        v2x_a.update_info(transform(0, 0), 0, true_pos=transform(0, 0))
        # Spoofed ego_pos is far away, but true_pos is physically in range.
        v2x_b.update_info(transform(1000, 0), 0, true_pos=transform(3, 0))
        v2x_a.search()
        assert "b" in v2x_a.cav_nearby

        # Spoofed ego_pos is now near, but true_pos moved out of radio range.
        # The nearby map must be rebuilt instead of keeping stale entries.
        v2x_b.update_info(transform(1, 0), 0, true_pos=transform(100, 0))
        v2x_a.search()
        assert "b" not in v2x_a.cav_nearby
