"""
Tests for RSUManager's multi-hop RSU-to-RSU perception relay
(_relay_neighbor_objects), including its cycle safety and per-hop
trust checking via the shared rsu_trust.is_plausible_rsu_object.
"""
import math
import sys
import types

import conftest  # noqa: F401 -- installs the shared fake carla module

carla = sys.modules["carla"]

if not hasattr(carla.Location, "distance"):
    def _location_distance(self, other):
        return math.sqrt((self.x - other.x) ** 2 +
                         (self.y - other.y) ** 2 +
                         (self.z - other.z) ** 2)
    carla.Location.distance = _location_distance


def _make_rsu_manager_class():
    """Import RSUManager with perception/localization/data_dumper
    faked out at import time (mirrors
    test_simulation_internals.py's _make_rsu_manager_class), so a
    real RSUManager can be constructed without a live CARLA world."""
    fake_perception_mod = types.ModuleType(
        "opencda.core.sensing.perception.perception_manager")

    class FakePerceptionManager:
        def __init__(self, vehicle, config_yaml, cav_world, carla_world,
                     data_dump, infra_id):
            self.infra_id = infra_id

        def detect(self, ego_pos):
            return {"vehicles": [], "traffic_lights": []}

        def destroy(self):
            pass

    fake_perception_mod.PerceptionManager = FakePerceptionManager

    fake_loc_mod = types.ModuleType(
        "opencda.core.sensing.localization.rsu_localization_manager")

    class FakeRsuLocalizationManager:
        def __init__(self, carla_world, config_yaml, carla_map):
            gp = config_yaml.get('global_position', [0, 0, 0, 0, 0, 0])
            self._x, self._y, self._z = gp[0], gp[1], gp[2]

        def localize(self):
            pass

        def get_ego_pos(self):
            return carla.Transform(
                carla.Location(x=self._x, y=self._y, z=self._z))

        def get_ego_spd(self):
            return 0.0

        def destroy(self):
            pass

    fake_loc_mod.LocalizationManager = FakeRsuLocalizationManager

    fake_dd_mod = types.ModuleType("opencda.core.common.data_dumper")

    class FakeDataDumper:
        def __init__(self, *args, **kwargs):
            pass

    fake_dd_mod.DataDumper = FakeDataDumper

    from unittest.mock import patch
    with patch.dict(sys.modules, {
        "opencda.core.sensing.perception.perception_manager":
            fake_perception_mod,
        "opencda.core.sensing.localization.rsu_localization_manager":
            fake_loc_mod,
        "opencda.core.common.data_dumper": fake_dd_mod,
        "numpy": types.SimpleNamespace(
            random=types.SimpleNamespace(
                normal=lambda *a, **k: 0, randint=lambda *a, **k: 0),
            linalg=types.SimpleNamespace(
                norm=lambda values: sum(v * v for v in values) ** 0.5),
            finfo=lambda _: types.SimpleNamespace(eps=0.0),
        ),
    }):
        sys.modules.pop("opencda.core.common.rsu_manager", None)
        import opencda.core.common.rsu_manager as rsu_manager_mod
        return rsu_manager_mod.RSUManager


class _FakeCavWorld:
    def __init__(self):
        self.global_clock = 0
        self._rsu_manager_dict = {}

    def get_vehicle_managers(self):
        return {}

    def update_rsu_manager(self, rsu):
        self._rsu_manager_dict[rsu.rid] = rsu


class _FakeObstacleVehicle:
    def __init__(self, carla_id, x=0, y=0, z=0, vx=0.0, vy=0.0, vz=0.0):
        self.carla_id = carla_id
        self.location = carla.Location(x=x, y=y, z=z)
        self.velocity = types.SimpleNamespace(x=vx, y=vy, z=vz)


def _rsu_config(rsu_id, x, y, max_relay_hops=0, communication_range=1000):
    return {
        "id": rsu_id,
        "spawn_position": [x, y, 0, 0, 0, 0],
        "sensing": {"localization": {}, "perception": {}},
        "v2x": {
            "communication_range": communication_range,
            "max_relay_hops": max_relay_hops,
        },
    }


def _spawn_rsu(RSUManager, cav_world, rsu_id, x, y, max_relay_hops=0,
              communication_range=1000):
    rsu = RSUManager(
        carla_world=None,
        config_yaml=_rsu_config(rsu_id, x, y, max_relay_hops,
                                communication_range),
        carla_map=None, cav_world=cav_world)
    rsu.update_info()
    return rsu


def test_max_relay_hops_defaults_to_zero():
    RSUManager = _make_rsu_manager_class()
    cav_world = _FakeCavWorld()
    rsu = _spawn_rsu(RSUManager, cav_world, rsu_id=1, x=0, y=0)
    assert rsu.max_relay_hops == 0


def test_relay_disabled_by_default_does_not_pull_in_neighbor_objects():
    """Two RSUs in range of each other, neither configured with
    max_relay_hops -- A must not see B's detections at all, matching
    pre-relay-feature behavior exactly."""
    RSUManager = _make_rsu_manager_class()
    cav_world = _FakeCavWorld()

    rsu_a = _spawn_rsu(RSUManager, cav_world, rsu_id=1, x=0, y=0)
    rsu_b = _spawn_rsu(RSUManager, cav_world, rsu_id=2, x=5, y=0)
    rsu_b.detected_objects = {
        "vehicles": [_FakeObstacleVehicle(carla_id=99, x=5, y=0)]}

    rsu_a.update_info()  # re-run after rsu_b's detections were set

    assert rsu_a.get_detected_objects()["vehicles"] == []


def test_single_hop_relay_pulls_in_direct_neighbor_objects():
    RSUManager = _make_rsu_manager_class()
    cav_world = _FakeCavWorld()

    rsu_a = _spawn_rsu(RSUManager, cav_world, rsu_id=1, x=0, y=0,
                       max_relay_hops=1)
    rsu_b = _spawn_rsu(RSUManager, cav_world, rsu_id=2, x=5, y=0,
                       max_relay_hops=1)
    rsu_b.detected_objects = {
        "vehicles": [_FakeObstacleVehicle(carla_id=99, x=5, y=0)]}

    rsu_a.update_info()

    relayed_ids = {v.carla_id for v in rsu_a.get_detected_objects()["vehicles"]}
    assert relayed_ids == {99}
    assert rsu_a.relay_stats["objects_relayed_total"] == 1


def test_relay_respects_hop_limit():
    """A - B - C chain (A and C not in each other's V2X range).
    max_relay_hops=1 must NOT let A see C's objects (that needs 2
    hops); max_relay_hops=2 must."""
    RSUManager = _make_rsu_manager_class()

    def build_chain(hops):
        cav_world = _FakeCavWorld()
        rsu_a = _spawn_rsu(RSUManager, cav_world, rsu_id=1, x=0, y=0,
                          max_relay_hops=hops, communication_range=10)
        # B and C stay at the default (relay off) deliberately -- only
        # A's own max_relay_hops is what this test is isolating. If B
        # also relayed (e.g. at the same hops value as A), B's own
        # update_info() below would pull C's object into B's own
        # detected_objects BEFORE A ever relays from B, making A's
        # result reflect B's hop limit too, not just A's.
        rsu_b = _spawn_rsu(RSUManager, cav_world, rsu_id=2, x=5, y=0,
                          max_relay_hops=0, communication_range=10)
        rsu_c = _spawn_rsu(RSUManager, cav_world, rsu_id=3, x=10, y=0,
                          max_relay_hops=0, communication_range=10)
        # A<->B and B<->C are in range (distance 5); A<->C (distance
        # 10) sits exactly at the 10-range boundary, and
        # V2XManager.search()'s `distance < range` is a strict
        # inequality, so A and C are correctly NOT direct V2X
        # neighbors -- reaching C's objects requires going through B.
        rsu_c.detected_objects = {
            "vehicles": [_FakeObstacleVehicle(carla_id=77, x=10, y=0)]}
        # rsu_nearby reflects whatever a given RSU last saw when IT
        # called update_info() (see _relay_neighbor_objects'
        # "Freshness note"), not the world's current state -- B was
        # spawned (and its update_info() ran) before C existed, so
        # B.rsu_nearby wouldn't include C without this. In a running
        # simulation every RSU's update_info() runs every tick, so
        # this staleness only shows up here because the test
        # constructs all three RSUs in one shot rather than across
        # ticks.
        rsu_b.update_info()
        return cav_world, rsu_a, rsu_b, rsu_c

    cav_world_1hop, rsu_a_1hop, rsu_b_1hop, rsu_c_1hop = build_chain(hops=1)
    rsu_a_1hop.update_info()
    ids_1hop = {v.carla_id for v in rsu_a_1hop.get_detected_objects()["vehicles"]}
    assert 77 not in ids_1hop

    cav_world_2hop, rsu_a_2hop, rsu_b_2hop, rsu_c_2hop = build_chain(hops=2)
    rsu_a_2hop.update_info()
    ids_2hop = {v.carla_id for v in rsu_a_2hop.get_detected_objects()["vehicles"]}
    assert 77 in ids_2hop


def test_relay_does_not_loop_in_a_triangle():
    """A, B, C all mutually in range (triangle mesh) with a generous
    hop budget -- must terminate and must not duplicate any object,
    even though every RSU can reach every other RSU through multiple
    paths."""
    RSUManager = _make_rsu_manager_class()
    cav_world = _FakeCavWorld()

    rsu_a = _spawn_rsu(RSUManager, cav_world, rsu_id=1, x=0, y=0,
                       max_relay_hops=5, communication_range=100)
    rsu_b = _spawn_rsu(RSUManager, cav_world, rsu_id=2, x=1, y=0,
                       max_relay_hops=5, communication_range=100)
    rsu_c = _spawn_rsu(RSUManager, cav_world, rsu_id=3, x=1, y=1,
                       max_relay_hops=5, communication_range=100)
    rsu_b.detected_objects = {
        "vehicles": [_FakeObstacleVehicle(carla_id=10, x=1, y=0)]}
    rsu_c.detected_objects = {
        "vehicles": [_FakeObstacleVehicle(carla_id=20, x=1, y=1)]}

    rsu_a.update_info()

    vehicles = rsu_a.get_detected_objects()["vehicles"]
    ids = [v.carla_id for v in vehicles]
    assert sorted(ids) == [10, 20]  # each object appears exactly once


def test_relay_applies_trust_check_per_hop():
    """An object relayed from B, but implausible relative to B's own
    communication_range, must be rejected -- even though A's own
    range would have accepted it as a raw distance."""
    RSUManager = _make_rsu_manager_class()
    cav_world = _FakeCavWorld()

    rsu_a = _spawn_rsu(RSUManager, cav_world, rsu_id=1, x=0, y=0,
                       max_relay_hops=1, communication_range=1000)
    rsu_b = _spawn_rsu(RSUManager, cav_world, rsu_id=2, x=5, y=0,
                       max_relay_hops=1, communication_range=10)
    # 500m from B (rsu_b's own communication_range is only 10) --
    # implausible relative to B, the RSU that actually reported it.
    rsu_b.detected_objects = {
        "vehicles": [_FakeObstacleVehicle(carla_id=99, x=505, y=0)]}

    rsu_a.update_info()

    assert rsu_a.get_detected_objects()["vehicles"] == []
    assert rsu_a.relay_stats["objects_rejected_implausible"] == 1


def test_relay_deduplicates_objects_seen_via_multiple_paths():
    """A diamond: A connects to both B and C, and B/C both report the
    same object (e.g. both saw the same car). The object must appear
    exactly once in A's merged list, not twice."""
    RSUManager = _make_rsu_manager_class()
    cav_world = _FakeCavWorld()

    rsu_a = _spawn_rsu(RSUManager, cav_world, rsu_id=1, x=0, y=0,
                       max_relay_hops=1, communication_range=100)
    rsu_b = _spawn_rsu(RSUManager, cav_world, rsu_id=2, x=5, y=0,
                       max_relay_hops=1, communication_range=100)
    rsu_c = _spawn_rsu(RSUManager, cav_world, rsu_id=3, x=-5, y=0,
                       max_relay_hops=1, communication_range=100)
    rsu_b.detected_objects = {
        "vehicles": [_FakeObstacleVehicle(carla_id=42, x=0, y=0)]}
    rsu_c.detected_objects = {
        "vehicles": [_FakeObstacleVehicle(carla_id=42, x=0, y=0)]}

    rsu_a.update_info()

    vehicles = rsu_a.get_detected_objects()["vehicles"]
    assert len(vehicles) == 1
    assert vehicles[0].carla_id == 42


def test_relay_does_not_duplicate_objects_already_locally_detected():
    """An object A already detected itself must not be duplicated
    even if a neighbor also relays it."""
    RSUManager = _make_rsu_manager_class()
    cav_world = _FakeCavWorld()

    rsu_a = _spawn_rsu(RSUManager, cav_world, rsu_id=1, x=0, y=0,
                       max_relay_hops=1, communication_range=100)
    rsu_b = _spawn_rsu(RSUManager, cav_world, rsu_id=2, x=5, y=0,
                       max_relay_hops=1, communication_range=100)
    rsu_a.detected_objects = {
        "vehicles": [_FakeObstacleVehicle(carla_id=55, x=2, y=0)]}
    rsu_b.detected_objects = {
        "vehicles": [_FakeObstacleVehicle(carla_id=55, x=2, y=0)]}

    rsu_a.update_info()

    vehicles = rsu_a.get_detected_objects()["vehicles"]
    matching = [v for v in vehicles if v.carla_id == 55]
    assert len(matching) == 1
