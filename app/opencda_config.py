from __future__ import annotations

import hashlib
import json
import math
import re
from pathlib import Path
from typing import Any

import yaml
from omegaconf import DictConfig, OmegaConf

from app.config import Settings
from app import utils


MAX_OPEN_CDA_CONFIG_LENGTH = 2_000_000
_ALLOWED_INTERPOLATIONS = {"${world.fixed_delta_seconds}"}
_INTERPOLATION_RE = re.compile(r"\$\{[^{}]+}")

# Weather-driven perception/localization scaling (see
# _apply_weather_perception_effects). Kept as module constants so the
# severity->effect mapping is visible in one place rather than buried
# in the function body.
_DEFAULT_DETECTION_RANGE_M = 50.0
_MIN_DETECTION_RANGE_M = 15.0
_MIN_DETECTION_RANGE_FRACTION = 0.4  # detection_range at severity 1.0, as a fraction of its pre-weather value
_MAX_GNSS_NOISE_MULTIPLIER = 3.0  # noise_*_stddev multiplier at severity 1.0


class OpenCDAConfigError(ValueError):
    pass


def _validate_interpolations(value: Any, path: str = "") -> None:
    if isinstance(value, dict):
        for key, child in value.items():
            child_path = f"{path}.{key}" if path else str(key)
            _validate_interpolations(child, child_path)
        return
    if isinstance(value, list):
        for index, child in enumerate(value):
            _validate_interpolations(child, f"{path}[{index}]")
        return
    if not isinstance(value, str):
        return

    unsupported = {
        match.group(0)
        for match in _INTERPOLATION_RE.finditer(value)
        if match.group(0) not in _ALLOWED_INTERPOLATIONS
    }
    if unsupported:
        values = ", ".join(sorted(unsupported))
        raise OpenCDAConfigError(
            f"Unsupported OmegaConf interpolation at {path or '<root>'}: {values}"
        )


def _mapping_at(config: dict[str, Any], path: str) -> dict[str, Any]:
    value: Any = config
    for part in path.split("."):
        if not isinstance(value, dict) or part not in value:
            raise OpenCDAConfigError(f"OpenCDA YAML must contain a '{path}' object")
        value = value[part]
    if not isinstance(value, dict):
        raise OpenCDAConfigError(f"OpenCDA YAML '{path}' must be an object")
    return value


def _require_keys(config: dict[str, Any], path: str, keys: set[str]) -> None:
    value = _mapping_at(config, path)
    missing = sorted(keys - value.keys())
    if missing:
        raise OpenCDAConfigError(
            f"OpenCDA YAML '{path}' is missing fields: {', '.join(missing)}"
        )


def _validate_attack_numbers(value: Any, path: str) -> None:
    if isinstance(value, bool):
        return
    if isinstance(value, (int, float)):
        if not math.isfinite(value):
            raise OpenCDAConfigError(f"attacks: {path} must be finite")
        return
    if isinstance(value, dict):
        for key, child in value.items():
            _validate_attack_numbers(child, f"{path}.{key}" if path else str(key))
        return
    if isinstance(value, list):
        for index, child in enumerate(value):
            _validate_attack_numbers(child, f"{path}[{index}]")

def _validate_attacks(config: dict[str, Any]) -> None:
    attacks = config.get("attacks")
    if attacks is None:
        return
    if not isinstance(attacks, list):
        raise OpenCDAConfigError("'attacks' must be a list")

    for index, item in enumerate(attacks):
        if not isinstance(item, dict):
            raise OpenCDAConfigError(f"attacks[{index}] must be an object")
        if set(item) == {"attack"}:
            raise OpenCDAConfigError(
                f"attacks[{index}] uses the unsupported legacy wrapper"
            )
        _validate_attack_numbers(item, f"attacks[{index}]")

def _validate_coordinates(value: Any, path: str, minimum: int) -> None:
    if not isinstance(value, list) or len(value) < minimum:
        raise OpenCDAConfigError(f"OpenCDA YAML '{path}' must contain at least {minimum} coordinates")
    for item in value[:minimum]:
        if not isinstance(item, (int, float)) or isinstance(item, bool):
            raise OpenCDAConfigError(f"OpenCDA YAML '{path}' coordinates must be numeric")
        if not math.isfinite(item):
            raise OpenCDAConfigError(f"OpenCDA YAML '{path}' coordinates must be finite")
    if any(not isinstance(item, (int, float)) for item in value[:minimum]):
        raise OpenCDAConfigError(f"OpenCDA YAML '{path}' coordinates must be numeric")


def _validate_complete_config(config: dict[str, Any]) -> None:
    _require_keys(
        config,
        "world",
        {"town", "sync_mode", "fixed_delta_seconds", "client_port", "seed", "weather"},
    )
    _require_keys(
        config,
        "world.weather",
        {
            "sun_altitude_angle",
            "cloudiness",
            "precipitation",
            "precipitation_deposits",
            "wind_intensity",
            "fog_density",
            "fog_distance",
            "fog_falloff",
            "wetness",
        },
    )
    for path in (
        "vehicle_base",
        "vehicle_base.sensing",
        "vehicle_base.sensing.perception",
        "vehicle_base.sensing.perception.camera",
        "vehicle_base.sensing.perception.lidar",
        "vehicle_base.sensing.localization",
        "vehicle_base.map_manager",
        "vehicle_base.safety_manager",
        "vehicle_base.behavior",
        "vehicle_base.behavior.local_planner",
        "vehicle_base.controller",
        "vehicle_base.v2x",
        "rsu_base",
        "rsu_base.sensing",
        "rsu_base.sensing.perception",
        "rsu_base.sensing.perception.camera",
        "rsu_base.sensing.perception.lidar",
        "rsu_base.sensing.localization",
        "carla_traffic_manager",
        "traffic_manager",
        "scenario",
    ):
        _mapping_at(config, path)
    _require_keys(
        config,
        "carla_traffic_manager",
        {
            "port",
            "sync_mode",
            "global_distance",
            "global_speed_perc",
            "set_osm_mode",
            "auto_lane_change",
            "ignore_lights_percentage",
            "ignore_signs_percentage",
            "ignore_walkers_percentage",
            "ignore_vehicles_percentage",
            "random_left_lanechange_percentage",
            "random_right_lanechange_percentage",
            "random",
            "vehicle_list",
            "range",
        },
    )
    required_fields = {
        "vehicle_base.sensing.perception": {"activate", "camera", "lidar"},
        "vehicle_base.sensing.perception.camera": {"visualize", "num"},
        "vehicle_base.sensing.perception.lidar": {
            "visualize",
            "channels",
            "range",
            "points_per_second",
            "rotation_frequency",
            "upper_fov",
            "lower_fov",
            "dropoff_general_rate",
            "dropoff_intensity_limit",
            "dropoff_zero_intensity",
            "noise_stddev",
        },
        "vehicle_base.sensing.localization": {
            "activate",
            "navigation_source",
            "dt",
            "gnss",
            "debug_helper",
        },
        "vehicle_base.sensing.localization.gnss": {
            "noise_alt_stddev",
            "noise_lat_stddev",
            "noise_lon_stddev",
            "heading_direction_stddev",
            "speed_stddev",
        },
        "vehicle_base.sensing.localization.debug_helper": {
            "show_animation",
            "x_scale",
            "y_scale",
        },
        "vehicle_base.map_manager": {
            "pixels_per_meter",
            "raster_size",
            "lane_sample_resolution",
            "visualize",
            "activate",
        },
        "vehicle_base.safety_manager": {
            "print_message",
            "collision_sensor",
            "stuck_dector",
            "offroad_dector",
            "traffic_light_detector",
        },
        "vehicle_base.safety_manager.collision_sensor": {
            "history_size",
            "col_thresh",
        },
        "vehicle_base.safety_manager.stuck_dector": {
            "len_thresh",
            "speed_thresh",
        },
        "vehicle_base.safety_manager.traffic_light_detector": {"light_dist_thresh"},
        "vehicle_base.behavior": {
            "max_speed",
            "tailgate_speed",
            "speed_lim_dist",
            "speed_decrease",
            "safety_time",
            "emergency_param",
            "ignore_traffic_light",
            "overtake_allowed",
            "collision_time_ahead",
            "overtake_counter_recover",
            "sample_resolution",
            "static_obstacle_avoidance_enabled",
            "local_planner",
        },
        "vehicle_base.behavior.local_planner": {
            "buffer_size",
            "trajectory_update_freq",
            "waypoint_update_freq",
            "min_dist",
            "trajectory_dt",
            "debug",
            "debug_trajectory",
        },
        "vehicle_base.controller": {"type", "args"},
        "vehicle_base.controller.args": {
            "lat",
            "lon",
            "dynamic",
            "dt",
            "max_brake",
            "max_throttle",
            "max_steering",
        },
        "vehicle_base.controller.args.lat": {"k_p", "k_d", "k_i"},
        "vehicle_base.controller.args.lon": {"k_p", "k_d", "k_i"},
        "vehicle_base.v2x": {
            "enabled",
            "communication_range",
            "position_source",
        },
        "rsu_base.sensing.perception": {"activate", "camera", "lidar"},
        "rsu_base.sensing.perception.camera": {"visualize", "num"},
        "rsu_base.sensing.perception.lidar": {
            "visualize",
            "channels",
            "range",
            "points_per_second",
            "rotation_frequency",
            "upper_fov",
            "lower_fov",
            "dropoff_general_rate",
            "dropoff_intensity_limit",
            "dropoff_zero_intensity",
            "noise_stddev",
        },
        "rsu_base.sensing.localization": {
            "activate",
            "dt",
            "gnss",
            "debug_helper",
        },
        "rsu_base.sensing.localization.gnss": {
            "noise_alt_stddev",
            "noise_lat_stddev",
            "noise_lon_stddev",
            "heading_direction_stddev",
            "speed_stddev",
        },
        "rsu_base.sensing.localization.debug_helper": {
            "show_animation",
            "x_scale",
            "y_scale",
        },
        "traffic_manager": {
            "global_distance_to_leading_vehicle",
            "synchronous_mode",
        },
    }
    for path, keys in required_fields.items():
        _require_keys(config, path, keys)

    fixed_delta = config["world"]["fixed_delta_seconds"]
    if (
        not isinstance(fixed_delta, (int, float))
        or not math.isfinite(fixed_delta)
        or fixed_delta <= 0
    ):
        raise OpenCDAConfigError(
            "world.fixed_delta_seconds must be a finite, positive number"
        )
    gnss_config = _mapping_at(
        config, "vehicle_base.sensing.localization.gnss"
    )
    for stddev_key in (
        "noise_alt_stddev", "noise_lat_stddev", "noise_lon_stddev",
        "heading_direction_stddev", "speed_stddev",
    ):
        stddev_value = gnss_config[stddev_key]
        if (
            not isinstance(stddev_value, (int, float))
            or isinstance(stddev_value, bool)
            or not math.isfinite(stddev_value)
            or stddev_value < 0
        ):
            raise OpenCDAConfigError(
                f"vehicle_base.sensing.localization.gnss.{stddev_key} "
                "must be a finite, non-negative number"
            )

    navigation_source = config["vehicle_base"]["sensing"]["localization"][
        "navigation_source"
    ]
    if navigation_source not in {"estimated", "ground_truth"}:
        raise OpenCDAConfigError(
            "vehicle_base.sensing.localization.navigation_source must be "
            "'estimated' or 'ground_truth'"
        )

    position_source = config["vehicle_base"]["v2x"]["position_source"]
    if position_source not in {"estimated", "ground_truth"}:
        raise OpenCDAConfigError(
            "vehicle_base.v2x.position_source must be "
            "'estimated' or 'ground_truth'"
        )

    for camera_path in (
        "vehicle_base.sensing.perception.camera",
        "rsu_base.sensing.perception.camera",
    ):
        camera = _mapping_at(config, camera_path)
        camera_count = camera["num"]
        if not isinstance(camera_count, int) or camera_count < 0:
            raise OpenCDAConfigError(
                f"{camera_path}.num must be a non-negative integer"
            )
        positions = camera.get("positions")
        if camera_count and (
            not isinstance(positions, list) or len(positions) < camera_count
        ):
            raise OpenCDAConfigError(
                f"{camera_path}.positions must contain at least {camera_count} entries"
            )

    traffic = config["carla_traffic_manager"]
    traffic_port = traffic["port"]
    if (
        not isinstance(traffic_port, int)
        or isinstance(traffic_port, bool)
        or not 1 <= traffic_port <= 65535
    ):
        raise OpenCDAConfigError(
            "carla_traffic_manager.port must be an integer between 1 and 65535"
        )
    if traffic["vehicle_list"] is not None and not isinstance(
        traffic["vehicle_list"], list
    ):
        raise OpenCDAConfigError(
            "carla_traffic_manager.vehicle_list must be a list or null"
        )
    if not isinstance(traffic["range"], list):
        raise OpenCDAConfigError("carla_traffic_manager.range must be a list")


def parse_open_cda_yaml(config_yaml: str) -> dict[str, Any]:
    if not isinstance(config_yaml, str) or not config_yaml.strip():
        raise OpenCDAConfigError("OpenCDA YAML cannot be empty")
    if len(config_yaml) > MAX_OPEN_CDA_CONFIG_LENGTH:
        raise OpenCDAConfigError(
            f"OpenCDA YAML exceeds {MAX_OPEN_CDA_CONFIG_LENGTH} characters"
        )

    try:
        parsed = yaml.safe_load(config_yaml)
    except yaml.YAMLError as exc:
        raise OpenCDAConfigError(f"Invalid OpenCDA YAML: {exc}") from exc

    if not isinstance(parsed, dict):
        raise OpenCDAConfigError("OpenCDA YAML root must be an object")
    _validate_complete_config(parsed)
    scenario = parsed["scenario"]
    if not isinstance(scenario.get("single_cav_list"), list):
        raise OpenCDAConfigError("scenario.single_cav_list must be a list")
    rsu_list = scenario.get("rsu_list")
    if not isinstance(rsu_list, list):
        raise OpenCDAConfigError("scenario.rsu_list must be a list")

    for index, cav in enumerate(scenario["single_cav_list"]):
        if not isinstance(cav, dict):
            raise OpenCDAConfigError(
                f"scenario.single_cav_list[{index}] must be an object"
            )
        if "destination" not in cav:
            raise OpenCDAConfigError(
                f"scenario.single_cav_list[{index}] must contain destination"
            )
        _validate_coordinates(
            cav["destination"],
            f"scenario.single_cav_list[{index}].destination",
            3,
        )
        if "spawn_position" not in cav and "spawn_special" not in cav:
            raise OpenCDAConfigError(
                f"scenario.single_cav_list[{index}] must contain spawn_position or spawn_special"
            )
        if "spawn_position" in cav:
            _validate_coordinates(
                cav["spawn_position"],
                f"scenario.single_cav_list[{index}].spawn_position",
                6,
            )
    for index, rsu in enumerate(rsu_list):
        if not isinstance(rsu, dict) or "spawn_position" not in rsu or "id" not in rsu:
            raise OpenCDAConfigError(
                f"scenario.rsu_list[{index}] must contain id and spawn_position"
            )
        _validate_coordinates(
            rsu["spawn_position"],
            f"scenario.rsu_list[{index}].spawn_position",
            6,
        )

    _validate_interpolations(parsed)
    _validate_attacks(parsed)
    return parsed


def validate_config_object_counts(
    config: dict[str, Any], scenario_groups: list[dict]
) -> None:
    scenario = config["scenario"]
    yaml_cavs = scenario.get("single_cav_list") or []
    yaml_rsus = scenario.get("rsu_list") or []
    request_cavs = sum(
        len(group.get("path") or [])
        for group in scenario_groups
        if group.get("vehicle") == "car"
    )
    request_rsus = sum(
        len(group.get("path") or [])
        for group in scenario_groups
        if group.get("vehicle") == "RSU"
    )
    if len(yaml_cavs) != request_cavs:
        raise OpenCDAConfigError(
            "OpenCDA YAML CAV count does not match the scenario payload "
            f"({len(yaml_cavs)} != {request_cavs})"
        )
    if len(yaml_rsus) != request_rsus:
        raise OpenCDAConfigError(
            "OpenCDA YAML RSU count does not match the scenario payload "
            f"({len(yaml_rsus)} != {request_rsus})"
        )


def _set_override(
    config: DictConfig,
    path: str,
    value: Any,
    reason: str,
    overrides: list[dict[str, Any]],
) -> None:
    previous = OmegaConf.select(config, path, default=None)
    if previous == value:
        return
    OmegaConf.update(config, path, value, merge=False, force_add=True)
    overrides.append(
        {
            "path": path,
            "source": previous,
            "effective": value,
            "reason": reason,
        }
    )


def _weather_severity(config: DictConfig) -> float:
    """Combine world.weather into a single 0..1 severity scalar.

    Averages precipitation, wetness, and fog_density (each on their
    native 0-100 scale) rather than picking one, since a scenario
    could set any subset of them (weather_override lets a user raise
    fog_density on its own, independent of the selected preset).
    Returns 0.0 for a clear/dry world.weather block -- callers use
    that to skip the override entirely via _set_override's no-op
    check, keeping config_overrides.json free of a weather section
    on non-adverse runs.
    """
    weather = OmegaConf.select(config, "world.weather", default={})
    precipitation = float(OmegaConf.select(weather, "precipitation", default=0) or 0)
    wetness = float(OmegaConf.select(weather, "wetness", default=0) or 0)
    fog_density = float(OmegaConf.select(weather, "fog_density", default=0) or 0)
    severity = (precipitation + wetness + fog_density) / 3.0 / 100.0
    return min(max(severity, 0.0), 1.0)


def _apply_weather_perception_effects(
    config: DictConfig,
    overrides: list[dict[str, Any]],
) -> None:
    """Scale perception/localization noise with the compiled weather.

    world.weather is otherwise cosmetic: with perception.activate and
    localization.activate both false by default, adverse weather
    changes only the CARLA render, not what a CAV/RSU detects or how
    accurately it localizes. This ties two already-configurable,
    already-noise-shaped knobs to severity so a rainy/foggy preset
    has a real effect on the run:

      - sensing.perception.detection_range (deactivate_mode's hard
        radius filter -- vehicles beyond it never enter
        objects['vehicles'], so this reaches safety_manager and the
        behavior agent, not just rendering) shrinks linearly with
        severity, floored at _MIN_DETECTION_RANGE_M so a maximally
        adverse run degrades perception rather than blinding it
        entirely.
      - sensing.localization.gnss's noise_*_stddev (and, for the
        vehicle, heading_direction_stddev/speed_stddev) scale up
        linearly with severity, up to _MAX_GNSS_NOISE_MULTIPLIER at
        severity 1.0. rsu_base's gnss block has no heading/speed
        keys (an RSU is stationary), so only its three noise_*
        keys are scaled.

    Both effects are skipped at severity 0.0 (via _set_override's
    no-op check on an unchanged value), so a clear-weather run's
    config_overrides.json stays exactly as it was before this
    function existed.

    A scenario's own explicit detection_range or noise_*_stddev
    value (set directly in the source YAML, not left at the
    vehicle_base/rsu_base default) is scaled from that value, not
    silently replaced -- this only multiplies/shrinks what's
    already compiled into the config.
    """
    severity = _weather_severity(config)
    if severity <= 0.0:
        return

    range_scale = 1.0 - severity * (1.0 - _MIN_DETECTION_RANGE_FRACTION)
    noise_scale = 1.0 + severity * (_MAX_GNSS_NOISE_MULTIPLIER - 1.0)

    for base_path in ("vehicle_base", "rsu_base"):
        detection_range_path = f"{base_path}.sensing.perception.detection_range"
        current_range = OmegaConf.select(
            config, detection_range_path, default=_DEFAULT_DETECTION_RANGE_M
        )
        scaled_range = max(
            current_range * range_scale, _MIN_DETECTION_RANGE_M
        )
        _set_override(
            config,
            detection_range_path,
            round(scaled_range, 2),
            f"scale perception.detection_range for compiled weather "
            f"severity {severity:.2f}",
            overrides,
        )

        gnss_path = f"{base_path}.sensing.localization.gnss"
        gnss_keys = ["noise_alt_stddev", "noise_lat_stddev", "noise_lon_stddev"]
        if base_path == "vehicle_base":
            gnss_keys += ["heading_direction_stddev", "speed_stddev"]
        for key in gnss_keys:
            stddev_path = f"{gnss_path}.{key}"
            current_stddev = OmegaConf.select(config, stddev_path, default=None)
            if current_stddev is None:
                continue
            _set_override(
                config,
                stddev_path,
                current_stddev * noise_scale,
                f"scale {key} for compiled weather severity {severity:.2f}",
                overrides,
            )


def apply_environment_overrides(
    config: DictConfig,
    settings: Settings,
    map_name: str,
) -> list[dict[str, Any]]:
    overrides: list[dict[str, Any]] = []
    _set_override(
        config,
        "world.town",
        map_name,
        "use the map loaded by the simulation request",
        overrides,
    )
    _set_override(
        config,
        "world.client_port",
        settings.carla_port,
        "use the backend CARLA port",
        overrides,
    )
    _set_override(
        config,
        "carla_traffic_manager.port",
        settings.carla_traffic_manager_port,
        "use the backend traffic manager port and avoid service port conflicts",
        overrides,
    )
    _set_override(
        config,
        "world.sync_mode",
        True,
        "this OpenCDA runner only supports synchronous mode",
        overrides,
    )
    _set_override(
        config,
        "carla_traffic_manager.sync_mode",
        True,
        "keep the CARLA traffic manager synchronized with the world",
        overrides,
    )
    _set_override(
        config,
        "traffic_manager.synchronous_mode",
        True,
        "keep the traffic manager synchronized with the world",
        overrides,
    )

    if OmegaConf.select(config, "blueprint.use_multi_class_bp", default=False):
        raw_path = OmegaConf.select(config, "blueprint.bp_meta_path", default="")
        allowed_root = (
            settings.base_dir / "opencda" / "assets" / "blueprint_meta"
        ).resolve()
        candidate = Path(str(raw_path))
        if not candidate.is_absolute():
            candidate = settings.base_dir / candidate
        candidate = candidate.resolve()
        if candidate.is_file() and candidate.is_relative_to(allowed_root):
            _set_override(
                config,
                "blueprint.bp_meta_path",
                str(candidate),
                "resolve the blueprint metadata path inside the allowed asset directory",
                overrides,
            )
        else:
            _set_override(
                config,
                "blueprint.use_multi_class_bp",
                False,
                "blueprint metadata is missing or outside the allowed asset directory",
                overrides,
            )

    _apply_weather_perception_effects(config, overrides)

    return overrides


def compile_open_cda_config(
    scenario_raw: dict[str, Any],
    settings: Settings,
    carla_map=None,
) -> tuple[DictConfig, list, list[dict[str, Any]]]:
    source_config = parse_open_cda_yaml(scenario_raw["opencda_config_yaml"])
    scenario_section, pedestrian_list, overrides = utils.yaml_to_runtime_scenario(
        source_config,
        scenario_raw,
        carla_map=carla_map,
    )
    effective_config = OmegaConf.merge(
        OmegaConf.create(source_config),
        OmegaConf.create(scenario_section),
    )
    overrides.extend(
        apply_environment_overrides(
            effective_config,
            settings,
            scenario_raw.get("map", "Town10HD").replace(".xodr", ""),
        )
    )
    return effective_config, pedestrian_list, overrides


def write_open_cda_artifacts(
    output_dir: str | Path,
    source_yaml: str,
    effective_config: DictConfig,
    overrides: list[dict[str, Any]],
) -> None:
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    source_bytes = source_yaml.encode("utf-8")
    (output_path / "source_config.yaml").write_bytes(source_bytes)

    effective_yaml = OmegaConf.to_yaml(
        effective_config,
        resolve=True,
        sort_keys=False,
    )
    (output_path / "effective_config.yaml").write_text(
        effective_yaml,
        encoding="utf-8",
    )
    (output_path / "config_overrides.json").write_text(
        json.dumps(
            {
                "source_sha256": hashlib.sha256(source_bytes).hexdigest(),
                "overrides": overrides,
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
