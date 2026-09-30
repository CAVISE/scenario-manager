"""Forensic telemetry collected while an OpenCDA scenario is running."""

from typing import Any

from app.log_config import get_logger

log = get_logger(__name__)


def format_location(location: Any) -> str:
    """Format CARLA coordinates consistently for forensic logs."""
    if location is None:
        return "None"
    return f"({location.x:.2f},{location.y:.2f},{location.z:.2f})"


def speed_kmh(vehicle: Any) -> float:
    velocity = vehicle.get_velocity()
    return (velocity.x**2 + velocity.y**2 + velocity.z**2) ** 0.5 * 3.6


def latest_safety_status(cav: Any) -> tuple[Any, dict]:
    status_queue = getattr(cav.safety_manager, "status_queue", None)
    if not status_queue:
        return None, {}
    return status_queue[-1]


def destination_distance(cav: Any) -> float | None:
    try:
        destination = cav.agent.end_waypoint.transform.location
        return cav.vehicle.get_location().distance(destination)
    except Exception:
        return None


def log_cav_forensic(
    tick_count: int,
    cav: Any,
    control: Any = None,
    note: str = "",
    *,
    logger: Any | None = None,
) -> None:
    """Log state useful for investigating CAV navigation and safety issues."""
    logger = logger or log
    ground_truth_transform = cav.vehicle.get_transform()
    ground_truth_location = ground_truth_transform.location
    estimated_transform = cav.localizer.get_estimated_ego_pos()
    estimated_location = (
        estimated_transform.location if estimated_transform is not None else None
    )
    navigation_pose = getattr(cav, "navigation_pose", None)
    navigation_location = (
        navigation_pose.location if navigation_pose is not None else None
    )
    transmitted_pose = getattr(cav, "transmitted_pose", None)
    transmitted_location = (
        transmitted_pose.location if transmitted_pose is not None else None
    )

    if estimated_location is not None:
        dx = estimated_location.x - ground_truth_location.x
        dy = estimated_location.y - ground_truth_location.y
        dz = estimated_location.z - ground_truth_location.z
        location_error = (dx**2 + dy**2 + dz**2) ** 0.5
        location_error_text = (
            f"dx={dx:.2f} dy={dy:.2f} dz={dz:.2f} norm={location_error:.2f}"
        )
    else:
        location_error_text = "unknown"

    safety_tick, status = latest_safety_status(cav)
    hazards = [
        key for key in ("collision", "offroad", "stuck", "ran_light") if status.get(key)
    ]
    hazard_text = ",".join(hazards) if hazards else "none"
    control_text = (
        f"thr={control.throttle:.3f} brake={control.brake:.3f} "
        f"steer={control.steer:.3f}"
        if control is not None
        else "None"
    )
    distance_to_destination = destination_distance(cav)
    rsu_stats = cav.rsu_merge_stats

    logger.debug(
        "[forensic] tick=%d cav=%d note=%s gt_pos=%s gt_yaw=%.2f "
        "estimated_pos=%s navigation_pos=%s transmitted_pos=%s "
        "loc_error=(%s) gt_speed=%.2f loc_speed=%.2f "
        "control=(%s) dest_dist=%s safety_tick=%s hazards=%s "
        "rsu_nearby=%d rsu_ticks=%d/%d rsu_merged_total=%d",
        tick_count,
        cav.vehicle.id,
        note or "-",
        format_location(ground_truth_location),
        ground_truth_transform.rotation.yaw,
        format_location(estimated_location),
        format_location(navigation_location),
        format_location(transmitted_location),
        location_error_text,
        speed_kmh(cav.vehicle),
        cav.localizer.get_ego_spd(),
        control_text,
        f"{distance_to_destination:.2f}"
        if distance_to_destination is not None
        else "unknown",
        safety_tick,
        hazard_text,
        len(cav.v2x_manager.rsu_nearby),
        rsu_stats["ticks_rsu_in_range"],
        rsu_stats["ticks_total"],
        rsu_stats["objects_merged_total"],
    )


def log_rsu_forensic(tick_count: int, rsu: Any, *, logger: Any | None = None) -> None:
    """Log state useful for investigating RSU perception and V2X issues."""
    logger = logger or log
    objects = rsu.get_detected_objects()
    counts = {
        key: len(value) for key, value in objects.items() if isinstance(value, list)
    }
    ego_position = rsu.localizer.get_ego_pos()
    location = ego_position.location if ego_position is not None else None
    logger.debug(
        "[forensic] tick=%d rsu=%s pos=%s range=%.2f detected=%s",
        tick_count,
        rsu.rid,
        format_location(location),
        rsu.communication_range,
        counts,
    )
