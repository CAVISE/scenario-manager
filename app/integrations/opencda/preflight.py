import math
from typing import Any

import carla

from app.log_config import get_logger

log = get_logger(__name__)


def check_scenario_matches_map(
    scene_dict: Any, carla_map: Any, *, logger: Any | None = None
) -> None:
    """Reject vehicle coordinates that clearly belong to another CARLA map."""
    logger = logger or log
    max_snap_distance_m = 40.0

    def snap_distance(x: float, y: float, z: float) -> float:
        waypoint = carla_map.get_waypoint(
            carla.Location(x=x, y=y, z=z),
            project_to_road=True,
            lane_type=carla.LaneType.Driving,
        )
        if waypoint is None:
            return math.inf
        location = waypoint.transform.location
        return math.dist((x, y), (location.x, location.y))

    offenders = []
    for cav in scene_dict.scenario.get("single_cav_list", []):
        for field in ("spawn_position", "destination"):
            position = cav.get(field)
            if not position:
                continue
            distance = snap_distance(
                position[0], position[1], position[2] if len(position) > 2 else 0.0
            )
            if distance > max_snap_distance_m:
                offenders.append(
                    f"{cav.get('name', '?')}.{field} ({distance:.0f}m off-road)"
                )

    for rsu in scene_dict.scenario.get("rsu_list", []):
        position = rsu.get("spawn_position")
        if not position:
            continue
        distance = snap_distance(
            position[0], position[1], position[2] if len(position) > 2 else 0.0
        )
        if distance > max_snap_distance_m:
            logger.warning(
                "RSU %s.spawn_position is %.0fm from the nearest driving lane "
                "on map '%s'. Continuing with its configured position.",
                rsu.get("name", "?"),
                distance,
                carla_map.name,
            )

    if offenders:
        raise RuntimeError(
            f"Scenario coordinates don't match map '{carla_map.name}' — "
            f"{len(offenders)} vehicle point(s) are implausibly far from a "
            f"driving lane (>{max_snap_distance_m:.0f}m): {', '.join(offenders)}. "
            "Re-place these entities on the current map before running."
        )


def check_perception_requires_apply_ml(scene_dict: Any, apply_ml: bool) -> None:
    """Turn an OpenCDA perception crash into a clear preflight error."""
    if apply_ml:
        return

    offenders = []
    for cav in scene_dict.scenario.get("single_cav_list", []):
        if cav.get("sensing", {}).get("perception", {}).get("activate"):
            offenders.append(cav.get("name", "?"))
    for rsu in scene_dict.scenario.get("rsu_list", []):
        if rsu.get("sensing", {}).get("perception", {}).get("activate"):
            offenders.append(rsu.get("name", "?"))

    if offenders:
        raise RuntimeError(
            f"{len(offenders)} entity(ies) have perception.activate=true "
            f"but apply_ml is false for this run: {', '.join(offenders)}. "
            "Either enable apply_ml, or turn off perception/detection."
        )
