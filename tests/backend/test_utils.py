import pytest
from app.utils import (
    json_to_single_cav_list,
    convert_coords,
    MAP_OFFSETS,
    _FALLBACK_DEST_Z,
    _FALLBACK_SPAWN_Z,
    _GNSS_BASELINE,
    _ensure_localization_baseline,
)


def _scenario_result(payload):
    result, _ = json_to_single_cav_list(payload)
    return result


def test_convert_coords_spawn():
    result = convert_coords(10, 5, 100, 50, is_spawn=True)
    assert result == [110, 45, _FALLBACK_SPAWN_Z]  # x+offset_x, -y+offset_y, z+1


def test_convert_coords_destination():
    result = convert_coords(10, 5, 100, 50, is_spawn=False)
    assert result == [110, 45, _FALLBACK_DEST_Z]  

def test_convert_coords_zero_offset():
    result = convert_coords(1, 2, 0, 0, is_spawn=True)
    assert result == [1, -2, _FALLBACK_SPAWN_Z]

def test_raises_on_missing_scenario_key():
    with pytest.raises(ValueError, match="'scenario' must be a list"):
        json_to_single_cav_list({"map": "Town01"})


def test_raises_on_non_list_scenario():
    with pytest.raises(ValueError):
        json_to_single_cav_list({"scenario": "not a list"})


def test_car_with_points_sets_destination():
    payload = {
        "map": "Town03",
        "map_offsets": {"x": 0, "y": 0},
        "scenario": [{
            "vehicle": "car",
            "path": [{
                "x": 10, "y": 20, "z": 0,
                "points": [{"x": 50, "y": 60, "z": 0}],
            }]
        }]
    }
    result = _scenario_result(payload)
    cav = result["scenario"]["single_cav_list"][0]
    assert cav["name"] == "cav1"
    assert cav["spawn_position"][0] == 10
    assert cav["destination"][0] == 50


def test_car_without_points_uses_spawn_as_destination():
    payload = {
        "map": "Town03",
        "scenario": [{
            "vehicle": "car",
            "path": [{"x": 5, "y": 5, "z": 0, "points": []}]
        }]
    }
    result = _scenario_result(payload)
    cav = result["scenario"]["single_cav_list"][0]
    assert cav["spawn_position"][:2] == cav["destination"][:2]
    assert cav["spawn_position"][2] == _FALLBACK_SPAWN_Z
    assert cav["destination"][2] == _FALLBACK_DEST_Z


def test_map_offset_applied_for_town01():
    offset_x, offset_y = MAP_OFFSETS["Town01"]
    payload = {
        "map": "Town01",
        "map_offsets": {"x": offset_x, "y": offset_y},
        "scenario": [{
            "vehicle": "car",
            "path": [{"x": 0, "y": 0, "z": 0, "points": []}]
        }]
    }
    result = _scenario_result(payload)
    cav = result["scenario"]["single_cav_list"][0]
    assert cav["spawn_position"][0] == offset_x
    assert cav["spawn_position"][1] == offset_y


def test_lidar_config_added_when_present():
    payload = {
        "map": "Town03",
        "scenario": [{
            "vehicle": "car",
            "path": [{
                "x": 0, "y": 0, "z": 0,
                "points": [],
                "lidars": [{"channels": 64, "range": 100, "rotation_frequency": 20}]
            }]
        }]
    }
    result = _scenario_result(payload)
    cav = result["scenario"]["single_cav_list"][0]
    assert cav["sensing"]["perception"]["lidar"]["channels"] == 64
    assert cav["sensing"]["perception"]["lidar"]["range"] == 100


def test_lidar_not_added_when_absent():
    payload = {
        "map": "Town03",
        "scenario": [{
            "vehicle": "car",
            "path": [{"x": 0, "y": 0, "z": 0, "points": [], "lidars": []}]
        }]
    }
    result = _scenario_result(payload)
    cav = result["scenario"]["single_cav_list"][0]
    assert "perception" not in cav["sensing"]


def test_rsu_added_to_rsu_list():
    payload = {
        "map": "Town03",
        "scenario": [{
            "vehicle": "RSU",
            "path": [{"x": 10, "y": 20, "z": 5, "range": 300, "tx_power": 30, "frequency": 5.9e9, "protocol": "ITS-G5"}]
        }]
    }
    result = _scenario_result(payload)
    rsu_list = result["scenario"]["rsu_list"]
    assert len(rsu_list) == 1
    assert rsu_list[0]["name"] == "rsu1"
    assert rsu_list[0]["v2x"]["communication_range"] == 300
    assert rsu_list[0]["v2x"]["tx_power"] == 30


def test_rsu_not_in_result_when_absent():
    payload = {
        "map": "Town03",
        "scenario": [{
            "vehicle": "car",
            "path": [{"x": 0, "y": 0, "z": 0, "points": []}]
        }]
    }
    result = _scenario_result(payload)
    assert "rsu_list" not in result["scenario"]


def test_multiple_cars_named_correctly():
    payload = {
        "map": "Town03",
        "scenario": [{
            "vehicle": "car",
            "path": [
                {"x": 0, "y": 0, "z": 0, "points": []},
                {"x": 1, "y": 1, "z": 0, "points": []},
                {"x": 2, "y": 2, "z": 0, "points": []},
            ]
        }]
    }
    result = _scenario_result(payload)
    names = [c["name"] for c in result["scenario"]["single_cav_list"]]
    assert names == ["cav1", "cav2", "cav3"]


def test_world_town_set_correctly():
    payload = {"map": "Town05", "scenario": []}
    result = _scenario_result(payload)
    assert result["world"]["town"] == "Town05"
    assert result["scenario"]["map"] == "Town05"


def test_empty_scenario_returns_empty_cav_list():
    payload = {"map": "Town03", "scenario": []}
    result = _scenario_result(payload)
    assert result["scenario"]["single_cav_list"] == []


def test_localization_baseline_overwrites_stale_gnss_values():
    cav_list = [{
        "sensing": {
            "localization": {
                "activate": False,
                "dt": 0.2,
                "gnss": {
                    "noise_alt_stddev": 15.0,
                    "noise_lat_stddev": 5e-4,
                    "noise_lon_stddev": 5e-4,
                    "heading_direction_stddev": 9.0,
                    "speed_stddev": 9.0,
                },
            }
        }
    }]

    _ensure_localization_baseline(cav_list)

    loc = cav_list[0]["sensing"]["localization"]
    assert loc["activate"] is True
    assert loc["dt"] == 0.05
    assert loc["gnss"] == _GNSS_BASELINE
