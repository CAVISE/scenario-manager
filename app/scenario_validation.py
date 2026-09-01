"""Shared validation rules for scenario POST bodies."""

from __future__ import annotations

import math
import re
from typing import Any

SCENARIO_ID_RE = re.compile(r"^[a-zA-Z0-9][a-zA-Z0-9_-]{0,127}$")
MAP_NAME_RE = re.compile(r"^[a-zA-Z0-9][a-zA-Z0-9_-]{0,127}$")
ALLOWED_VEHICLE_TYPES = frozenset({"car", "RSU", "building", "pedestrian"})
MAX_SCENARIO_NAME_LEN = 200
MAX_SCENARIO_ID_LEN = 128
MAX_DESCRIPTION_LEN = 4000
MAX_OPENDRIVE_LEN = 32_000_000
MAX_PREVIEW_LEN = 10_000_000
MAX_SCENARIO_GROUPS = 50
MAX_PATH_ITEMS_PER_GROUP = 500

OPENDRIVE_RE = re.compile(r"<\s*OpenDRIVE(?:\s|>)", re.IGNORECASE)


def normalize_optional_str(value: Any) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def validate_scenario_id(value: Any, *, required: bool = False) -> str | None:
    normalized = normalize_optional_str(value)
    if not normalized:
        if required:
            raise ValueError("scenario_id is required")
        return None
    if len(normalized) > MAX_SCENARIO_ID_LEN:
        raise ValueError(
            f"scenario_id must be at most {MAX_SCENARIO_ID_LEN} characters"
        )
    if not SCENARIO_ID_RE.match(normalized):
        raise ValueError(
            "scenario_id must start with a letter or digit and contain only "
            "letters, digits, underscores, and hyphens"
        )
    return normalized


def validate_map_name(normalized: str) -> str:
    if not MAP_NAME_RE.match(normalized):
        raise ValueError(
            "map must start with a letter or digit and contain only letters, "
            "digits, underscores, and hyphens (no path separators)"
        )
    return normalized


def validate_scenario_name(value: Any) -> str:
    normalized = normalize_optional_str(value)
    if not normalized:
        raise ValueError("name_of_scenario cannot be empty")
    if len(normalized) > MAX_SCENARIO_NAME_LEN:
        raise ValueError(
            f"name_of_scenario must be at most {MAX_SCENARIO_NAME_LEN} characters"
        )
    return normalized


def validate_optional_text(
    value: Any,
    *,
    field_name: str,
    max_len: int,
) -> str | None:
    normalized = normalize_optional_str(value)
    if normalized and len(normalized) > max_len:
        raise ValueError(f"{field_name} must be at most {max_len} characters")
    return normalized


def validate_opendrive(value: Any) -> str | None:
    if value is None:
        return None
    if not isinstance(value, str):
        raise ValueError("file_ must contain OpenDRIVE XML")
    if not value.strip():
        return None
    if len(value) > MAX_OPENDRIVE_LEN:
        raise ValueError(f"file_ must be at most {MAX_OPENDRIVE_LEN} characters")
    if not OPENDRIVE_RE.search(value):
        raise ValueError("file_ must contain OpenDRIVE XML")
    return value


def validate_preview(value: Any) -> str | None:
    if value is None:
        return None
    text = str(value)
    if len(text) > MAX_PREVIEW_LEN:
        raise ValueError(f"preview must be at most {MAX_PREVIEW_LEN} characters")
    return text


def validate_attack_numbers(attacks: list[dict]) -> list[dict]:
    def _walk(value: Any, path: str) -> None:
        if isinstance(value, bool):
            return
        if isinstance(value, (int, float)):
            if not math.isfinite(value):
                raise ValueError(f"attacks: {path} must be finite")
        elif isinstance(value, dict):
            for key, nested in value.items():
                _walk(nested, f"{path}.{key}" if path else str(key))
        elif isinstance(value, list):
            for index, nested in enumerate(value):
                _walk(nested, f"{path}[{index}]")

    for attack_index, attack in enumerate(attacks):
        _walk(attack, f"attacks[{attack_index}]")

    return attacks


def extract_scenario_groups(scenario: Any) -> list[dict[str, Any]]:
    if scenario is None:
        return []
    if isinstance(scenario, list):
        groups = scenario
    elif isinstance(scenario, dict):
        raw = scenario.get("scenario_text")
        if raw is None:
            return []
        if not isinstance(raw, list):
            raise ValueError("scenario.scenario_text must be a list")
        groups = raw
    else:
        raise ValueError("scenario must be an object or array")

    if len(groups) > MAX_SCENARIO_GROUPS:
        raise ValueError(
            f"scenario cannot contain more than {MAX_SCENARIO_GROUPS} groups"
        )

    for index, group in enumerate(groups):
        if not isinstance(group, dict):
            raise ValueError(f"scenario group #{index + 1} must be an object")
        vehicle = group.get("vehicle")
        if vehicle not in ALLOWED_VEHICLE_TYPES:
            raise ValueError(
                f"scenario group #{index + 1} has invalid vehicle type: {vehicle!r}"
            )
        path = group.get("path")
        if path is None:
            continue
        if not isinstance(path, list):
            raise ValueError(f"scenario group #{index + 1} path must be a list")
        if len(path) > MAX_PATH_ITEMS_PER_GROUP:
            raise ValueError(
                f"scenario group #{index + 1} path exceeds "
                f"{MAX_PATH_ITEMS_PER_GROUP} items"
            )
        for path_index, item in enumerate(path):
            if not isinstance(item, dict):
                raise ValueError(
                    f"scenario group #{index + 1} path item #{path_index + 1} "
                    "must be an object"
                )
            for coord in ("x", "y", "z"):
                if coord not in item:
                    raise ValueError(
                        f"scenario group #{index + 1} path item #{path_index + 1} "
                        f"missing coordinate '{coord}'"
                    )
                try:
                    coordinate = float(item[coord])
                except (TypeError, ValueError) as exc:
                    raise ValueError(
                        f"scenario group #{index + 1} path item #{path_index + 1} "
                        f"coordinate '{coord}' must be a number"
                    ) from exc
                if not math.isfinite(coordinate):
                    raise ValueError(
                        f"scenario group #{index + 1} path item #{path_index + 1} "
                        f"coordinate '{coord}' must be finite"
                    )
            points = item.get("points")
            if points is not None:
                if not isinstance(points, list):
                    raise ValueError(
                        f"scenario group #{index + 1} path item #{path_index + 1} "
                        "points must be a list"
                    )
                for point_index, point in enumerate(points):
                    if not isinstance(point, dict):
                        raise ValueError(
                            f"scenario group #{index + 1} path item #{path_index + 1} "
                            f"point #{point_index + 1} must be an object"
                        )
                    for coord in ("x", "y", "z"):
                        if coord not in point:
                            continue
                        try:
                            point_coordinate = float(point[coord])
                        except (TypeError, ValueError) as exc:
                            raise ValueError(
                                f"scenario group #{index + 1} path item "
                                f"#{path_index + 1} point #{point_index + 1} "
                                f"coordinate '{coord}' must be a number"
                            ) from exc
                        if not math.isfinite(point_coordinate):
                            raise ValueError(
                                f"scenario group #{index + 1} path item "
                                f"#{path_index + 1} point #{point_index + 1} "
                                f"coordinate '{coord}' must be finite"
                            )

    return groups
