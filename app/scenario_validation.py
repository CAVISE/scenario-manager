"""Shared validation rules for scenario POST bodies."""

from __future__ import annotations

import re
from typing import Any

SCENARIO_ID_RE = re.compile(r"^[a-zA-Z0-9][a-zA-Z0-9_-]{0,127}$")
ALLOWED_VEHICLE_TYPES = frozenset({"car", "RSU", "building", "pedestrian"})
MAX_SCENARIO_NAME_LEN = 200
MAX_SCENARIO_ID_LEN = 128
MAX_DESCRIPTION_LEN = 4000
MAX_FILE_REF_LEN = 512
MAX_PREVIEW_LEN = 500_000
MAX_SCENARIO_GROUPS = 50
MAX_PATH_ITEMS_PER_GROUP = 500

OPENDRIVE_MARKERS = ("<OpenDRIVE", "<opendrive")


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
        raise ValueError(f"scenario_id must be at most {MAX_SCENARIO_ID_LEN} characters")
    if not SCENARIO_ID_RE.match(normalized):
        raise ValueError(
            "scenario_id must start with a letter or digit and contain only "
            "letters, digits, underscores, and hyphens"
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


def validate_file_reference(value: Any) -> str | None:
    normalized = validate_optional_text(
        value, field_name="file_", max_len=MAX_FILE_REF_LEN
    )
    if not normalized:
        return None
    if any(marker in normalized for marker in OPENDRIVE_MARKERS):
        raise ValueError("file_ must be a map file name, not OpenDRIVE XML content")
    if "\n" in normalized or "\r" in normalized:
        raise ValueError("file_ must be a single-line map reference")
    return normalized


def validate_preview(value: Any) -> str | None:
    if value is None:
        return None
    text = str(value)
    if len(text) > MAX_PREVIEW_LEN:
        raise ValueError(f"preview must be at most {MAX_PREVIEW_LEN} characters")
    return text


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
        raise ValueError(f"scenario cannot contain more than {MAX_SCENARIO_GROUPS} groups")

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
                    float(item[coord])
                except (TypeError, ValueError) as exc:
                    raise ValueError(
                        f"scenario group #{index + 1} path item #{path_index + 1} "
                        f"coordinate '{coord}' must be a number"
                    ) from exc

    return groups
