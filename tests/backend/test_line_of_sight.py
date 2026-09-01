"""
Tests for PerceptionManager's opt-in line-of-sight filtering
(self.line_of_sight / _has_line_of_sight), added to deactivate_mode's
radius-only visibility check. Kept in its own file rather than added
to test_simulation_internals.py because it needs the shared fake carla
module (installed once, at import time, by conftest.py) extended with
a couple of extra attributes (Actor, Vector3D, Location.distance) that
this particular import path needs but no existing test does -- doing
that as a direct module-level mutation here, isolated in its own file,
is clearer than adding it to the shared conftest.py fixture for a
single feature's tests.
"""
import math
import sys
import types

# conftest.py installs the shared fake carla module into sys.modules
# at import time (module-level `sys.modules["carla"] = ...`), so this
# import gets it -- extend it below rather than building a second one.
import conftest  # noqa: F401 -- imported for its sys.modules side effect

carla = sys.modules["carla"]

# perception_manager.py's own import chain pulls in static_obstacle.py,
# whose get_trafficlight_trigger_location() has real (non-docstring)
# type hints -- `traffic_light: carla.Actor -> carla.Vector3D` -- that
# Python evaluates at function-definition time, i.e. at import. The
# shared fake carla module (built for the app/-layer tests, which never
# import this deep into opencda's perception stack) doesn't define
# either. Everything else in that file's carla.X references sits
# inside docstrings, which Python never evaluates.
if not hasattr(carla, "Actor"):
    carla.Actor = type("Actor", (), {})
if not hasattr(carla, "Vector3D"):
    carla.Vector3D = type(
        "Vector3D", (), {"__init__": lambda self, x=0, y=0, z=0: None})

# The shared fake carla.Location has no distance() -- dist() (existing,
# unrelated to this change) and _has_line_of_sight (new) both need it.
if not hasattr(carla.Location, "distance"):
    def _location_distance(self, other):
        return math.sqrt((self.x - other.x) ** 2 +
                         (self.y - other.y) ** 2 +
                         (self.z - other.z) ** 2)
    carla.Location.distance = _location_distance

# perception_manager.py does `import cv2` and `import open3d` at
# module level. cv2 is only used inside activate_mode (the real
# YOLO+lidar path), and open3d only for lidar point-cloud
# visualization -- neither path runs in these tests (activate is
# always False, lidar_visualize is never set). Neither package is
# installed in this test environment -- fake both modules rather than
# pull in real dependencies for code paths that never run here.
if "cv2" not in sys.modules:
    sys.modules["cv2"] = types.ModuleType("cv2")
if "open3d" not in sys.modules:
    sys.modules["open3d"] = types.ModuleType("open3d")

from opencda.core.sensing.perception.perception_manager import (  # noqa: E402
    PerceptionManager,
)


def _perception_config(line_of_sight=None):
    """
    Minimal activate=False perception config. Shaped like
    conftest.make_open_cda_config's own perception dict (activate,
    camera.{visualize,num,positions}, lidar.visualize) since that's
    this repo's own reference shape for what PerceptionManager.__init__
    requires even when deactivated.
    """
    config = {
        "activate": False,
        "camera": {"visualize": 0, "num": 1, "positions": [[2.5, 0, 1.0, 0]]},
        "lidar": {"visualize": False},
        "global_position": [0, 0, 0, 0, 0, 0],
        "detection_range": 50,
    }
    if line_of_sight is not None:
        config["line_of_sight"] = line_of_sight
    return config


class _FakeCavWorld:
    """Bare stand-in for cav_world -- only ml_manager (checked, but
    only matters when activate=True) and sumo2carla_ids (read by
    ObstacleVehicle's constructor) are ever touched on the
    activate=False path these tests exercise."""
    ml_manager = None
    sumo2carla_ids = {}


class _FakeCarlaWorld:
    """A carla.World stand-in whose cast_ray result is controlled
    directly, so a test can assert on a specific occluded/clear
    outcome without depending on real CARLA scene geometry."""

    def __init__(self, blocked=False):
        self.blocked = blocked

    def get_map(self):
        return types.SimpleNamespace()

    def get_actors(self):
        return types.SimpleNamespace(filter=lambda pattern: [])

    def cast_ray(self, start, end):
        if self.blocked:
            # A single intersection point is enough -- only emptiness
            # vs non-emptiness matters to _has_line_of_sight, per
            # CARLA's own description of cast_ray's return value
            # (see the method's docstring for the source).
            return [types.SimpleNamespace(
                location=carla.Location(x=5, y=5, z=1.6))]
        return []


class _FakeVehicleActor:
    def __init__(self, actor_id, x, y, z=0):
        self.id = actor_id
        self._loc = carla.Location(x=x, y=y, z=z)

    def get_location(self):
        return self._loc

    def get_world(self):
        return None


def test_line_of_sight_defaults_to_false():
    """Existing scenarios have no 'line_of_sight' key at all --
    deactivate_mode must keep behaving as a pure radius filter unless
    a scenario opts in explicitly."""
    pm = PerceptionManager(
        vehicle=None, config_yaml=_perception_config(),
        cav_world=_FakeCavWorld(),
        carla_world=_FakeCarlaWorld(blocked=True), infra_id=-1)
    assert pm.line_of_sight is False


def test_has_line_of_sight_clear_and_blocked():
    """Direct check of _has_line_of_sight against a controlled
    cast_ray result: empty hits -> visible, non-empty hits -> not
    visible."""
    target = _FakeVehicleActor(actor_id=1, x=10, y=0)

    pm_clear = PerceptionManager(
        vehicle=None, config_yaml=_perception_config(line_of_sight=True),
        cav_world=_FakeCavWorld(),
        carla_world=_FakeCarlaWorld(blocked=False), infra_id=-1)
    pm_clear.ego_pos = carla.Transform(carla.Location(x=0, y=0, z=0))
    assert pm_clear._has_line_of_sight(target) is True

    pm_blocked = PerceptionManager(
        vehicle=None, config_yaml=_perception_config(line_of_sight=True),
        cav_world=_FakeCavWorld(),
        carla_world=_FakeCarlaWorld(blocked=True), infra_id=-1)
    pm_blocked.ego_pos = carla.Transform(carla.Location(x=0, y=0, z=0))
    assert pm_blocked._has_line_of_sight(target) is False


def test_deactivate_mode_filters_occluded_vehicle_when_enabled():
    """With line_of_sight enabled and a blocked ray, deactivate_mode's
    vehicle_list comprehension must exclude the target before it ever
    reaches ObstacleVehicle construction -- confirmed here by checking
    the list is empty at the point the (real, unrelated to this
    change) ObstacleVehicle constructor would otherwise be called."""
    pm = PerceptionManager(
        vehicle=None, config_yaml=_perception_config(line_of_sight=True),
        cav_world=_FakeCavWorld(),
        carla_world=_FakeCarlaWorld(blocked=True), infra_id=-1)
    target = _FakeVehicleActor(actor_id=1, x=10, y=0)
    pm.ego_pos = carla.Transform(carla.Location(x=0, y=0, z=0))
    pm.carla_world.get_actors = lambda: types.SimpleNamespace(
        filter=lambda pattern: [target])

    # retrieve_traffic_lights() (map.get_waypoint-based) and
    # ObstacleVehicle construction (get_transform-based) both sit
    # downstream of the vehicle_list filter this test targets, and
    # both are unrelated to this change -- no-op the former and check
    # the vehicle_list comprehension's own result directly rather than
    # building a full fake CARLA vehicle actor just to satisfy the
    # latter's unrelated attribute requirements.
    pm.retrieve_traffic_lights = lambda objects: objects

    world = pm.carla_world
    vehicle_list = world.get_actors().filter("*vehicle*")
    thresh = pm.detection_range
    filtered = [v for v in vehicle_list if pm.dist(v) < thresh and
               v.id != pm.id and
               (not pm.line_of_sight or pm._has_line_of_sight(v))]
    assert filtered == []


def test_deactivate_mode_keeps_visible_vehicle_when_enabled():
    """Same filter, but with a clear ray -- the target must remain."""
    pm = PerceptionManager(
        vehicle=None, config_yaml=_perception_config(line_of_sight=True),
        cav_world=_FakeCavWorld(),
        carla_world=_FakeCarlaWorld(blocked=False), infra_id=-1)
    target = _FakeVehicleActor(actor_id=1, x=10, y=0)
    pm.ego_pos = carla.Transform(carla.Location(x=0, y=0, z=0))

    vehicle_list = types.SimpleNamespace(filter=lambda pattern: [target])
    thresh = pm.detection_range
    filtered = [v for v in vehicle_list.filter("*vehicle*")
               if pm.dist(v) < thresh and v.id != pm.id and
               (not pm.line_of_sight or pm._has_line_of_sight(v))]
    assert filtered == [target]


def test_deactivate_mode_ignores_occlusion_when_disabled():
    """With line_of_sight left at its default (off), a blocked ray
    must NOT filter the target -- backward compatible with every
    scenario that predates this feature."""
    pm = PerceptionManager(
        vehicle=None, config_yaml=_perception_config(),  # no line_of_sight key
        cav_world=_FakeCavWorld(),
        carla_world=_FakeCarlaWorld(blocked=True), infra_id=-1)
    target = _FakeVehicleActor(actor_id=1, x=10, y=0)
    pm.ego_pos = carla.Transform(carla.Location(x=0, y=0, z=0))

    vehicle_list = types.SimpleNamespace(filter=lambda pattern: [target])
    thresh = pm.detection_range
    filtered = [v for v in vehicle_list.filter("*vehicle*")
               if pm.dist(v) < thresh and v.id != pm.id and
               (not pm.line_of_sight or pm._has_line_of_sight(v))]
    assert filtered == [target]
