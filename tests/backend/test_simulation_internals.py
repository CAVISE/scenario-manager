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
        v2x_b.update_info(transform(1000, 0), 0, true_pos=transform(3, 0))
        v2x_a.search()
        assert "b" in v2x_a.cav_nearby

        v2x_b.update_info(transform(1, 0), 0, true_pos=transform(100, 0))
        v2x_a.search()
        assert "b" not in v2x_a.cav_nearby


def _make_rsu_manager_class():
    """
    Import RSUManager with its perception/localization dependencies
    replaced by lightweight fakes, so the test exercises RSUManager's
    own __init__/update_info logic (in particular its new V2XManager
    wiring) without needing a real carla_map or CARLA perception stack.
    Both fakes are swapped in via sys.modules before import, since the
    real perception_manager/rsu_localization_manager modules evaluate
    carla.Actor / carla.Map type hints and geolocation calls at
    import/construction time that the repo's shared fake carla module
    (built for the app/-layer tests) doesn't provide.
    """
    class FakeRsuPerceptionManager:
        def __init__(self, vehicle, config_yaml, cav_world, carla_world,
                     data_dump, infra_id):
            self.infra_id = infra_id

        def detect(self, ego_pos):
            return {"vehicles": [], "traffic_lights": []}

        def destroy(self):
            pass

    class FakeRsuLocalizationManager:
        _counter = 0

        def __init__(self, carla_world, config_yaml, carla_map):
            self.config_yaml = config_yaml
            FakeRsuLocalizationManager._counter += 1
            self._n = FakeRsuLocalizationManager._counter

        def localize(self):
            pass

        def get_ego_pos(self):
            import carla
            return carla.Transform(
                carla.Location(x=self._n, y=self._n, z=0))

        def get_ego_spd(self):
            return 0.0

        def destroy(self):
            pass

    fake_perception_mod = types.ModuleType(
        "opencda.core.sensing.perception.perception_manager")
    fake_perception_mod.PerceptionManager = FakeRsuPerceptionManager

    fake_loc_mod = types.ModuleType(
        "opencda.core.sensing.localization.rsu_localization_manager")
    fake_loc_mod.LocalizationManager = FakeRsuLocalizationManager

    # data_dumper.py module-level-imports cv2/open3d regardless of
    # whether DataDumper is ever instantiated. None of these tests pass
    # data_dumping=True, so DataDumper itself is never touched -- fake
    # the whole module rather than fighting cv2/open3d's own import
    # chain (neither package is installed in this test environment).
    fake_data_dumper_mod = types.ModuleType(
        "opencda.core.common.data_dumper")

    class FakeDataDumper:
        def __init__(self, *args, **kwargs):
            pass

    fake_data_dumper_mod.DataDumper = FakeDataDumper

    # v2x_manager.py does `import numpy as np` at module level. In this
    # test environment, a real numpy import that happens to be the
    # first FULL (non-mocked) one in the process -- which is exactly
    # what popping v2x_manager from sys.modules and re-importing it
    # here would trigger, if the real numpy was never actually
    # imported before this point -- errors with numpy's own "cannot
    # load module more than once per process" (reproduced even by a
    # standalone bare `import numpy` after a pop, independent of any
    # mocking in this file; not something this test can fix). The
    # existing test_v2x_search_uses_true_positions_and_rebuilds_nearby
    # above sidesteps this by never letting the real numpy import
    # happen at all -- it patches sys.modules['numpy'] with a fake
    # before its own `from ... import V2XManager`. Do the same here,
    # and -- unlike rsu_manager, which must be dropped and re-imported
    # fresh each call so it binds this call's fake perception/
    # localization classes -- deliberately do NOT pop v2x_manager from
    # sys.modules: if it's already cached (e.g. bound to that other
    # test's fake numpy, if that test ran first in this process), a
    # plain re-import is a harmless cache hit; if it isn't cached yet,
    # this fake numpy is what it will import against.
    fake_numpy = types.SimpleNamespace(
        random=types.SimpleNamespace(
            normal=lambda *a, **k: 0, randint=lambda *a, **k: 0),
        linalg=types.SimpleNamespace(
            norm=lambda values: sum(v * v for v in values) ** 0.5),
        finfo=lambda _: types.SimpleNamespace(eps=0.0),
    )

    with patch.dict(sys.modules, {
        "numpy": fake_numpy,
        "opencda.core.sensing.perception.perception_manager":
            fake_perception_mod,
        "opencda.core.sensing.localization.rsu_localization_manager":
            fake_loc_mod,
        "opencda.core.common.data_dumper": fake_data_dumper_mod,
    }):
        # Only rsu_manager needs a fresh import each call, to bind to
        # this call's fake perception/localization/data_dumper classes
        # above rather than a copy cached from an earlier call.
        sys.modules.pop("opencda.core.common.rsu_manager", None)
        import opencda.core.common.rsu_manager as rsu_manager_mod
        return rsu_manager_mod.RSUManager


class _FakeCavWorldForRsu:
    def __init__(self):
        self.global_clock = 0
        self._rsu_manager_dict = {}
        self._pedestrian_manager_dict = {}
        self.managers = {}

    def get_vehicle_managers(self):
        return self.managers

    def update_rsu_manager(self, rsu):
        self._rsu_manager_dict[rsu.rid] = rsu

    def update_pedestrian_manager(self, pedestrian):
        self._pedestrian_manager_dict[pedestrian.pid] = pedestrian


def _base_rsu_config(rsu_id=1, v2x=None):
    config = {
        "id": rsu_id,
        "spawn_position": [0, 0, 0, 0, 0, 0],
        "sensing": {"localization": {}, "perception": {}},
    }
    if v2x is not None:
        config["v2x"] = v2x
    return config


def test_rsu_manager_v2x_integration():
    """
    Covers RSUManager's new V2XManager wiring end to end. Combined into
    one test (rather than one test per aspect) because RSUManager
    transitively imports v2x_manager.py, which does `import numpy`; in
    this test environment numpy's C-extension errors on a second import
    of anything that re-triggers its own init path when the module is
    re-imported fresh across separate tests in the same pytest process
    ("cannot load module more than once per process") -- reproduced
    even by numpy itself outside any of this file's own mocking, so
    it's an environment constraint to work around, not a bug in the
    mocking here. One _make_rsu_manager_class() call, one fresh import,
    all assertions against it.
    """
    RSUManager = _make_rsu_manager_class()

    # 1. Legacy config with no 'v2x' section at all (a saved scenario
    #    predating this integration). Must not KeyError on V2XManager's
    #    required 'enabled'/'communication_range' keys, and must keep
    #    working exactly as before (default 45m range). RSUs are
    #    stationary infrastructure, unlike CAVs, so loc/yaw/speed noise
    #    and lag must default to 0 rather than inheriting V2XManager's
    #    CAV-oriented per-key defaults.
    cav_world = _FakeCavWorldForRsu()
    rsu_legacy = RSUManager(carla_world=None, config_yaml=_base_rsu_config(),
                            carla_map=None, cav_world=cav_world)
    assert rsu_legacy.communication_range == 45
    assert rsu_legacy.v2x_manager.cda_enabled is True
    assert rsu_legacy.v2x_manager.communication_range == 45
    assert rsu_legacy.v2x_manager.loc_noise == 0.0
    assert rsu_legacy.v2x_manager.yaw_noise == 0.0
    assert rsu_legacy.v2x_manager.speed_noise == 0.0
    assert rsu_legacy.v2x_manager.lag == 0

    # 2. Config shaped like what the frontend currently emits for an
    #    RSU's v2x block (communication_range/tx_power/frequency/
    #    protocol/beacon_interval, but no 'enabled'). Must not KeyError
    #    and must still enable V2X by default.
    cav_world2 = _FakeCavWorldForRsu()
    frontend_shaped_config = _base_rsu_config(v2x={
        "communication_range": 60,
        "tx_power": 20,
        "frequency": 5.9,
        "protocol": "DSRC",
        "beacon_interval": 100,
    })
    rsu_frontend = RSUManager(carla_world=None,
                              config_yaml=frontend_shaped_config,
                              carla_map=None, cav_world=cav_world2)
    assert rsu_frontend.communication_range == 60
    assert rsu_frontend.v2x_manager.cda_enabled is True
    assert rsu_frontend.v2x_manager.communication_range == 60

    # 3. update_info() must push the RSU's localized position/speed
    #    into its own v2x_manager (not just perception), using its own
    #    position as both transmitted and true_pos since RSUs are never
    #    GNSS-spoofed. Perception must keep working exactly as before.
    assert len(rsu_legacy.v2x_manager.ego_pos) == 0
    rsu_legacy.update_info()
    assert len(rsu_legacy.v2x_manager.ego_pos) == 1
    assert rsu_legacy.v2x_manager.true_pos is not None
    assert rsu_legacy.detected_objects == {"vehicles": [], "traffic_lights": []}

    # 4. A CAV-side V2XManager searching cav_world._rsu_manager_dict
    #    must still discover RSUs by their own communication_range
    #    after this change -- that discovery path is separate from an
    #    RSU's own new v2x_manager and must be unaffected by it.
    import carla
    from opencda.core.common.v2x_manager import V2XManager

    cav_world3 = _FakeCavWorldForRsu()
    rsu_a = RSUManager(carla_world=None,
                       config_yaml=_base_rsu_config(
                           rsu_id=1, v2x={"communication_range": 50}),
                       carla_map=None, cav_world=cav_world3)
    rsu_a.update_info()
    rsu_b = RSUManager(carla_world=None,
                       config_yaml=_base_rsu_config(
                           rsu_id=2, v2x={"communication_range": 50}),
                       carla_map=None, cav_world=cav_world3)
    rsu_b.update_info()

    cav_v2x = V2XManager(cav_world3, {"enabled": True,
                                      "communication_range": 100}, "cav-1")
    cav_v2x.update_info(
        carla.Transform(carla.Location(x=0, y=0, z=0)), 0,
        true_pos=carla.Transform(carla.Location(x=0, y=0, z=0)))
    assert rsu_a.rid in cav_v2x.rsu_nearby
    assert rsu_b.rid in cav_v2x.rsu_nearby

    # 5. V2XManager has no destroy() method on either the CAV or RSU
    #    side by design (it holds no CARLA actors). RSUManager.destroy()
    #    must not attempt to call one.
    rsu_legacy.destroy()  # must not raise
    rsu_frontend.destroy()  # must not raise


class _FakeWalker:
    """Stand-in for a carla.Walker actor -- only what PedestrianManager
    itself touches (is_alive, get_transform, get_velocity, id)."""

    def __init__(self, actor_id, x=0, y=0, z=0, vx=0.0, vy=0.0, vz=0.0):
        import carla
        self.id = actor_id
        self.is_alive = True
        self._transform = carla.Transform(carla.Location(x=x, y=y, z=z))
        self._velocity = types.SimpleNamespace(x=vx, y=vy, z=vz)

    def get_transform(self):
        return self._transform

    def get_velocity(self):
        return self._velocity


def _pedestrian_config(v2x=None):
    config = {"spawn": [0, 0, 0], "speed": 1.2, "cross_factor": 0.5,
             "is_invincible": False}
    if v2x is not None:
        config["v2x"] = v2x
    return config


def test_pedestrian_manager_v2x_integration():
    """
    Covers PedestrianManager's V2X wiring end to end, following the
    same numpy-import-environment-constraint reasoning as
    test_rsu_manager_v2x_integration above (PedestrianManager also
    transitively imports v2x_manager.py's `import numpy`) -- one fake
    numpy in a single patch.dict, all assertions inside it.
    """
    import carla

    fake_numpy = types.SimpleNamespace(
        random=types.SimpleNamespace(
            normal=lambda *a, **k: 0, randint=lambda *a, **k: 0),
        linalg=types.SimpleNamespace(
            norm=lambda values: sum(v * v for v in values) ** 0.5),
        finfo=lambda _: types.SimpleNamespace(eps=0.0),
    )
    with patch.dict(sys.modules, {"numpy": fake_numpy}):
        from opencda.core.common.pedestrian_manager import PedestrianManager

        # 1. Legacy/minimal config with no 'v2x' section at all. Must
        #    not KeyError on V2XManager's required keys, and must
        #    default to communication_range=45, enabled=True, and
        #    zero noise/lag -- pedestrians are never GNSS-spoofed
        #    (position comes straight from the CARLA walker actor),
        #    same reasoning as RSUManager.
        cav_world = _FakeCavWorldForRsu()
        walker = _FakeWalker(actor_id=101, x=5, y=5, z=0)
        ped_legacy = PedestrianManager(
            walker, controller=types.SimpleNamespace(),
            config_yaml=_pedestrian_config(), cav_world=cav_world)
        assert ped_legacy.pid == 101
        assert ped_legacy.communication_range == 45
        assert ped_legacy.v2x_manager.cda_enabled is True
        assert ped_legacy.v2x_manager.communication_range == 45
        assert ped_legacy.v2x_manager.loc_noise == 0.0
        assert ped_legacy.v2x_manager.yaw_noise == 0.0
        assert ped_legacy.v2x_manager.speed_noise == 0.0
        assert ped_legacy.v2x_manager.lag == 0
        # Registered with cav_world under its own pid.
        assert cav_world._pedestrian_manager_dict[101] is ped_legacy

        # 2. Config shaped like what app/utils.py now emits (v2x dict
        #    with tx_power/frequency/protocol/beacon_interval/
        #    communication_range, no 'enabled'). Must not KeyError and
        #    must still enable V2X by default.
        cav_world2 = _FakeCavWorldForRsu()
        walker2 = _FakeWalker(actor_id=102, x=0, y=0, z=0)
        ped_frontend = PedestrianManager(
            walker2, controller=types.SimpleNamespace(),
            config_yaml=_pedestrian_config(v2x={
                "communication_range": 60, "tx_power": 10,
                "frequency": 5.9e9, "protocol": "DSRC",
                "beacon_interval": 1000}),
            cav_world=cav_world2)
        assert ped_frontend.communication_range == 60
        assert ped_frontend.v2x_manager.cda_enabled is True

        # 3. get_ego_pos()/get_ego_spd() read straight from the walker
        #    actor -- position from get_transform(), speed converted
        #    m/s -> km/h from get_velocity()'s magnitude.
        walker3 = _FakeWalker(actor_id=103, x=1, y=2, z=0,
                              vx=3.0, vy=4.0, vz=0.0)  # |v| = 5 m/s
        ped3 = PedestrianManager(
            walker3, controller=types.SimpleNamespace(),
            config_yaml=_pedestrian_config(), cav_world=_FakeCavWorldForRsu())
        pos = ped3.get_ego_pos()
        assert pos.location.x == 1 and pos.location.y == 2
        # |v|=5 m/s -> 18 km/h. Not pytest.approx() here: approx()
        # itself probes sys.modules['numpy'] internally, which inside
        # this patch.dict block is the fake numpy above -- a plain
        # tolerance check avoids depending on pytest's own numpy
        # interaction while numpy is mocked.
        assert abs(ped3.get_ego_spd() - 18.0) < 1e-9

        # A walker no longer alive must not raise -- None position,
        # zero speed, matching how V2XManager.search() already
        # handles a None RSU position (see the rsu_pos is None check
        # in search() -- pedestrian_pos is None is symmetric with it).
        walker3.is_alive = False
        assert ped3.get_ego_pos() is None
        assert ped3.get_ego_spd() == 0.0
        walker3.is_alive = True  # restore for the next check below

        # 4. update_info() must push position/speed into v2x_manager,
        #    using the pedestrian's own position as both transmitted
        #    and true_pos (never GNSS-spoofed, same as RSUManager).
        assert len(ped3.v2x_manager.ego_pos) == 0
        ped3.update_info()
        assert len(ped3.v2x_manager.ego_pos) == 1
        assert ped3.v2x_manager.true_pos is not None

        # 5. A CAV-side V2XManager searching
        #    cav_world._pedestrian_manager_dict must discover the
        #    pedestrian by its own communication_range, the same way
        #    it discovers RSUs -- via the new pedestrian_nearby dict,
        #    populated by search()'s new pedestrian block.
        from opencda.core.common.v2x_manager import V2XManager

        cav_world5 = _FakeCavWorldForRsu()
        walker5 = _FakeWalker(actor_id=105, x=0, y=0, z=0)
        ped5 = PedestrianManager(
            walker5, controller=types.SimpleNamespace(),
            config_yaml=_pedestrian_config(v2x={"communication_range": 50}),
            cav_world=cav_world5)
        ped5.update_info()

        cav_v2x = V2XManager(cav_world5, {"enabled": True,
                                          "communication_range": 100}, "cav-1")
        cav_v2x.update_info(
            carla.Transform(carla.Location(x=0, y=0, z=0)), 0,
            true_pos=carla.Transform(carla.Location(x=0, y=0, z=0)))
        assert ped5.pid in cav_v2x.pedestrian_nearby
        assert cav_v2x.pedestrian_nearby[ped5.pid] is ped5

        # Out of range: same setup but the pedestrian is far away.
        cav_world6 = _FakeCavWorldForRsu()
        walker6 = _FakeWalker(actor_id=106, x=1000, y=0, z=0)
        ped6 = PedestrianManager(
            walker6, controller=types.SimpleNamespace(),
            config_yaml=_pedestrian_config(v2x={"communication_range": 50}),
            cav_world=cav_world6)
        ped6.update_info()
        cav_v2x6 = V2XManager(cav_world6, {"enabled": True,
                                           "communication_range": 100}, "cav-1")
        cav_v2x6.update_info(
            carla.Transform(carla.Location(x=0, y=0, z=0)), 0,
            true_pos=carla.Transform(carla.Location(x=0, y=0, z=0)))
        assert ped6.pid not in cav_v2x6.pedestrian_nearby

        # 6. destroy() is a documented no-op (app/runner.py's
        #    _destroy_pedestrians owns the actual CARLA actor
        #    cleanup) -- must not raise and must not touch the walker.
        ped_legacy.destroy()
        assert walker.is_alive is True
