"""Runtime OpenCDA configuration overrides derived from the environment."""

from pathlib import Path
from typing import Any

from omegaconf import DictConfig, OmegaConf

from app.config import Settings

_DEFAULT_DETECTION_RANGE_M = 50.0
_MIN_DETECTION_RANGE_M = 15.0
_MIN_DETECTION_RANGE_FRACTION = 0.4
_MAX_GNSS_NOISE_MULTIPLIER = 3.0


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
    """Combine precipitation, wetness and fog density into a 0..1 scalar."""
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
    """Scale perception range and GNSS noise for adverse compiled weather."""
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
        scaled_range = max(current_range * range_scale, _MIN_DETECTION_RANGE_M)
        _set_override(
            config,
            detection_range_path,
            round(scaled_range, 2),
            "scale perception.detection_range for compiled weather "
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


def weather_report(config: DictConfig) -> dict[str, Any]:
    """Summarize the weather effects applied to the effective configuration."""
    weather = OmegaConf.select(config, "world.weather", default={}) or {}
    severity = _weather_severity(config)
    active = severity > 0.0
    return {
        "raw": {
            key: OmegaConf.select(weather, key, default=None)
            for key in (
                "cloudiness",
                "precipitation",
                "precipitation_deposits",
                "wind_intensity",
                "sun_altitude_angle",
                "fog_density",
                "fog_distance",
                "fog_falloff",
                "wetness",
            )
        },
        "severity": round(severity, 4),
        "active": active,
        "effect": {
            "detection_range_scale": round(
                1.0 - severity * (1.0 - _MIN_DETECTION_RANGE_FRACTION), 4
            ),
            "gnss_noise_scale": round(
                1.0 + severity * (_MAX_GNSS_NOISE_MULTIPLIER - 1.0), 4
            ),
        }
        if active
        else None,
        "note": (
            "precipitation/wetness/fog_density are 0, so weather had no "
            "effect this run beyond the CARLA render -- perception "
            "detection_range and GNSS noise were unchanged."
            if not active
            else "precipitation/wetness/fog_density combined into a nonzero "
            "severity, which shrank sensing.perception.detection_range "
            "and scaled up sensing.localization.gnss noise_*_stddev for "
            "every CAV and RSU (see effect above and "
            "config_overrides.json for the exact before/after values)."
        ),
    }


def apply_environment_overrides(
    config: DictConfig,
    settings: Settings,
    map_name: str,
) -> list[dict[str, Any]]:
    """Apply host, map, safety and weather overrides to an effective config."""
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
