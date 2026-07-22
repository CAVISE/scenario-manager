import pytest

from app.utils import (
    MAP_OFFSETS,
    _FALLBACK_DEST_Z,
    _FALLBACK_SPAWN_Z,
    _compute_yaw,
    convert_coords,
    yaml_to_runtime_scenario,
)


def _payload(cav_count=1, rsu_count=0, pedestrians=0, map_name="Town03"):
    scenario = []
    if cav_count:
        scenario.append(
            {
                "vehicle": "car",
                "path": [
                    {
                        "x": index,
                        "y": index,
                        "z": 0,
                        "points": [{"x": index + 10, "y": index, "z": 0}],
                    }
                    for index in range(cav_count)
                ],
            }
        )
    if rsu_count:
        scenario.append(
            {
                "vehicle": "RSU",
                "path": [
                    {"x": index, "y": index, "z": 0} for index in range(rsu_count)
                ],
            }
        )
    if pedestrians:
        scenario.append(
            {
                "vehicle": "pedestrian",
                "path": [
                    {
                        "x": index,
                        "y": index,
                        "z": 0,
                        "speed": 1.8,
                        "cross_factor": 0.2,
                        "is_invincible": False,
                    }
                    for index in range(pedestrians)
                ],
            }
        )
    return {
        "map": map_name,
        "map_offsets": {"x": 0, "y": 0},
        "scenario_name": "test",
        "scenario": scenario,
    }


def test_convert_coords_spawn():
    result = convert_coords(10, 5, 100, 50, is_spawn=True)
    assert result == [110, 45, _FALLBACK_SPAWN_Z]


def test_convert_coords_destination():
    result = convert_coords(10, 5, 100, 50, is_spawn=False)
    assert result == [110, 45, _FALLBACK_DEST_Z]


def test_convert_coords_zero_offset():
    result = convert_coords(1, 2, 0, 0, is_spawn=True)
    assert result == [1, -2, _FALLBACK_SPAWN_Z]


def test_yaml_compiler_requires_scenario_list(open_cda_config_factory):
    with pytest.raises(ValueError, match="'scenario' must be a list"):
        yaml_to_runtime_scenario(open_cda_config_factory(), {"map": "Town01"})


def test_yaml_is_authoritative_for_cav_fields(open_cda_config_factory):
    config = open_cda_config_factory()
    source_cav = config["scenario"]["single_cav_list"][0]
    source_cav["name"] = "configured-cav"
    source_cav["spawn_position"] = [10, 20, 7, 0, 123, 0]
    source_cav["destination"] = [50, 60, 8]
    source_cav["behavior"] = {"max_speed": 31}
    payload = _payload()
    payload["scenario"][0]["path"][0].update({"x": 999, "y": 999})

    result, pedestrians, overrides = yaml_to_runtime_scenario(config, payload)

    cav = result["scenario"]["single_cav_list"][0]
    assert cav["name"] == "configured-cav"
    assert cav["spawn_position"][:3] == [10, -20, _FALLBACK_SPAWN_Z]
    assert cav["destination"] == [50, -60, _FALLBACK_DEST_Z]
    assert cav["behavior"]["max_speed"] == 31
    assert pedestrians == []
    assert {item["path"] for item in overrides} >= {
        "scenario.single_cav_list[0].spawn_position",
        "scenario.single_cav_list[0].destination",
    }


def test_map_offset_is_applied_to_yaml_coordinates(open_cda_config_factory):
    config = open_cda_config_factory()
    config["scenario"]["single_cav_list"][0]["spawn_position"] = [0, 0, 0, 0, 0, 0]
    offset_x, offset_y = MAP_OFFSETS["Town01"]
    payload = _payload(map_name="Town01")
    payload["map_offsets"] = {"x": offset_x, "y": offset_y}

    result, _, _ = yaml_to_runtime_scenario(config, payload)

    spawn = result["scenario"]["single_cav_list"][0]["spawn_position"]
    assert spawn[:2] == [offset_x, offset_y]
    assert result["scenario"]["map"] == "Town01"


def test_yaml_compiler_preserves_rsu_configuration(open_cda_config_factory):
    config = open_cda_config_factory(cav_count=0, rsu_count=1)
    source_rsu = config["scenario"]["rsu_list"][0]
    source_rsu["v2x"]["communication_range"] = 300
    source_rsu["sensing"]["perception"]["detection_range"] = 175

    result, _, _ = yaml_to_runtime_scenario(
        config,
        _payload(cav_count=0, rsu_count=1),
    )

    rsu = result["scenario"]["rsu_list"][0]
    assert rsu["v2x"]["communication_range"] == 300
    assert rsu["sensing"]["perception"]["detection_range"] == 175


def test_yaml_compiler_builds_pedestrians_from_json(open_cda_config_factory):
    result, pedestrians, _ = yaml_to_runtime_scenario(
        open_cda_config_factory(),
        _payload(pedestrians=1),
    )

    assert len(result["scenario"]["single_cav_list"]) == 1
    assert pedestrians == [
        {
            "spawn": [0, 0, _FALLBACK_SPAWN_Z],
            "speed": 1.8,
            "cross_factor": 0.2,
            "is_invincible": False,
        }
    ]


def test_attack_configuration_comes_from_yaml(open_cda_config_factory):
    attack = {
        "name": "gnss",
        "type": "spoofer",
        "targets": {"cav_index": 1},
        "params": {"intensity": "high"},
    }
    config = open_cda_config_factory(cav_count=2, attacks=[attack])

    result, _, _ = yaml_to_runtime_scenario(config, _payload(cav_count=2))

    first, second = result["scenario"]["single_cav_list"]
    first_loc = first["sensing"]["localization"]
    assert first_loc["activate"] is True
    assert first_loc["gnss"]["noise_alt_stddev"] == 15
    assert "sensing" not in second


def test_drift_attack_is_compiled_as_runtime_spoofing(
    open_cda_config_factory,
):
    params = {
        "mode": "drift",
        "start_time": 10,
        "ramp_duration": 8,
        "lateral_offset": 1.8,
        "longitudinal_offset": 0.5,
        "drift_rate": 0.08,
        "jitter_stddev": 0.08,
        "max_offset": 3,
    }
    attack = {
        "name": "gnss_drift",
        "targets": {"cav_index": 2},
        "stages": [{"id": "drift", "type": "spoofer", "params": params}],
    }
    config = open_cda_config_factory(cav_count=2, attacks=[attack])

    result, _, _ = yaml_to_runtime_scenario(config, _payload(cav_count=2))

    first, second = result["scenario"]["single_cav_list"]
    assert "sensing" not in first
    assert second["sensing"]["localization"]["gnss_spoofing"] == params
    assert second["sensing"]["localization"]["activate"] is True


def test_yaml_compiler_rejects_object_count_mismatch(open_cda_config_factory):
    with pytest.raises(ValueError, match="object counts"):
        yaml_to_runtime_scenario(
            open_cda_config_factory(cav_count=2),
            _payload(cav_count=1),
        )


class _FakeLocation:
    def __init__(self, x, y, z=0, waypoint=None):
        self.x = x
        self.y = y
        self.z = z
        self.waypoint = waypoint


class _FakeRotation:
    def __init__(self, yaw):
        self.yaw = yaw


class _FakeTransform:
    def __init__(self, waypoint, yaw):
        self.location = _FakeLocation(
            waypoint.road_id,
            waypoint.lane_id,
            waypoint=waypoint,
        )
        self.rotation = _FakeRotation(yaw)


class _FakeWaypoint:
    lane_type = "Driving"

    def __init__(self, road_id, lane_id, yaw):
        self.road_id = road_id
        self.lane_id = lane_id
        self.section_id = 0
        self.transform = _FakeTransform(self, yaw)
        self._left = None
        self._right = None
        self._next = []

    def get_left_lane(self):
        return self._left

    def get_right_lane(self):
        return self._right

    def next_until_lane_end(self, _):
        return []

    def next(self, _):
        return self._next


class _FakeMap:
    def __init__(self, spawn, dest):
        self.spawn = spawn
        self.dest = dest

    def get_waypoint(self, location, **_):
        if getattr(location, "waypoint", None) is not None:
            return location.waypoint
        return self.spawn if location.x == 0 else self.dest


def test_compute_yaw_prefers_shorter_reachable_route(monkeypatch):
    import carla

    monkeypatch.setattr(
        carla,
        "LaneType",
        type("LaneType", (), {"Driving": "Driving"}),
        raising=False,
    )

    dest = _FakeWaypoint(50, 1, 90)
    slow_mid_1 = _FakeWaypoint(20, -1, 0)
    slow_mid_2 = _FakeWaypoint(30, -1, 0)
    spawn = _FakeWaypoint(10, -1, 0)
    left = _FakeWaypoint(10, 1, 180)

    spawn._left = left
    spawn._next = [slow_mid_1]
    slow_mid_1._next = [slow_mid_2]
    slow_mid_2._next = [dest]
    left._next = [dest]

    yaw = _compute_yaw(0, 0, 0, -10, 1, carla_map=_FakeMap(spawn, dest))

    assert yaw == 180
