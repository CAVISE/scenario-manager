import math
import logging
log = logging.getLogger(__name__)

MAP_OFFSETS = {
    'Town01':   (212.003,  123.089),
    'Town02':   (97.995,   223.571),
    'Town03':   (18.755,   -22.391),
    'Town04':   (199.921, -169.704),
    'Town05':   (-56.835,    3.766),
    'Town06':   (122.551,  110.646),
    'Town07':   (-74.443,  -47.197),
    'Town10HD': (-8.377,    28.583),
}

# Fallback z when carla_map is not yet available (Phase 1 bootstrap).
# Low enough that get_waypoint finds the ground-level road; the actual z
# is always overwritten by sim_api's waypoint snap anyway.
_FALLBACK_SPAWN_Z = 0.5
_FALLBACK_DEST_Z  = 0.0


def _waypoint_z(carla_map, x: float, y: float, hint_z: float = 0.0) -> float | None:
    """
    Return the road-surface z at (x, y) according to carla_map, or None if
    no drivable waypoint is found nearby.
    """
    try:
        import carla as _carla
        wp = carla_map.get_waypoint(
            _carla.Location(x=x, y=y, z=hint_z),
            project_to_road=True,
            lane_type=_carla.LaneType.Driving,
        )
        return wp.transform.location.z if wp is not None else None
    except Exception as exc:
        log.warning("_waypoint_z failed at (%.2f, %.2f): %s", x, y, exc)
        return None


def convert_coords(x, y, offset_x, offset_y, carla_map=None, is_spawn=True):
    """
    Convert OpenDRIVE editor coordinates to CARLA world coordinates.

        carla_x =  editor_x + offset_x
        carla_y = -editor_y + offset_y

    z is taken from the road waypoint when carla_map is provided (handles
    multi-level roads / overpasses correctly).  Without carla_map a safe
    fallback height is used so that the Phase-1 ScenarioManager can boot.

    For spawn points we add a small +0.3 m clearance above the road surface
    so the vehicle does not clip into the ground before the first tick.
    For destination points the road-surface z is used as-is (LocalPlanner
    only needs an approximate hint).
    """
    carla_x = x + offset_x
    carla_y = -y + offset_y

    if carla_map is not None:
        road_z = _waypoint_z(carla_map, carla_x, carla_y)
        if road_z is not None:
            carla_z = road_z + 0.3 if is_spawn else road_z
        else:
            log.warning("No waypoint found for (%.2f, %.2f) — using fallback z", carla_x, carla_y)
            carla_z = _FALLBACK_SPAWN_Z if is_spawn else _FALLBACK_DEST_Z
    else:
        carla_z = _FALLBACK_SPAWN_Z if is_spawn else _FALLBACK_DEST_Z

    return [carla_x, carla_y, carla_z]


def _compute_yaw(sx: float, sy: float, sz: float,
                 dx: float, dy: float,
                 carla_map=None) -> float:
    """
    Return the spawn yaw for a CAV.

    Prefers the road-waypoint yaw at (sx, sy, sz) when carla_map is available
    because it matches exactly what sim_api's snap logic will produce.
    Falls back to the atan2 heuristic (spawn→destination vector) otherwise.
    """
    if carla_map is not None:
        try:
            import carla as _carla
            wp = carla_map.get_waypoint(
                _carla.Location(x=sx, y=sy, z=sz),
                project_to_road=True,
                lane_type=_carla.LaneType.Driving,
            )
            if wp is not None:
                yaw = wp.transform.rotation.yaw
                log.info("yaw=%.1f deg (road waypoint)", yaw)
                return yaw
            log.warning("get_waypoint returned None for (%.2f, %.2f, %.2f) — atan2 fallback",
                        sx, sy, sz)
        except Exception as exc:
            log.warning("carla_map.get_waypoint failed: %s — atan2 fallback", exc)

    # atan2 fallback
    carla_dx = dx - sx
    carla_dy = dy - sy
    yaw = math.degrees(math.atan2(carla_dy, carla_dx)) if (
        abs(carla_dx) > 0.1 or abs(carla_dy) > 0.1
    ) else 0.0
    log.info("yaw=%.1f deg (atan2 fallback)", yaw)
    return yaw


def json_to_single_cav_list(json_data: dict, carla_map=None) -> dict:

    if "scenario" not in json_data or not isinstance(json_data["scenario"], list):
        raise ValueError("Invalid payload: 'scenario' must be a list")

    cav_list = []
    rsu_list = []

    map_name = json_data.get("map", "Town10HD").replace(".xodr", "")
    offset_x, offset_y = MAP_OFFSETS.get(map_name, (0.0, 0.0))
    log.debug("map=%s offset_x=%s offset_y=%s", map_name, offset_x, offset_y)

    cav_index = 0
    for group in json_data["scenario"]:
        vehicle_type = group.get("vehicle")

        if vehicle_type == "car":
            for car in group["path"]:
                cav_index += 1
                points = car.get("points", [])
                dest   = points[-1] if points else None

                sx, sy, sz = convert_coords(
                    car["x"], car["y"], offset_x, offset_y,
                    carla_map=carla_map, is_spawn=True,
                )
                if dest:
                    dx, dy, dz = convert_coords(
                        dest["x"], dest["y"], offset_x, offset_y,
                        carla_map=carla_map, is_spawn=False,
                    )
                else:
                    dx, dy, dz = sx, sy, _FALLBACK_DEST_Z

                log.info("CAV%d spawn=(%.2f, %.2f, %.2f) dest=(%.2f, %.2f, %.2f)",
                         cav_index, sx, sy, sz, dx, dy, dz)

                spawn_yaw = _compute_yaw(sx, sy, sz, dx, dy, carla_map=carla_map)
                log.info("CAV%d spawn_yaw=%.1f deg", cav_index, spawn_yaw)

                cav: dict = {
                    "name": f"cav{cav_index}",
                    "spawn_position": [sx, sy, sz, 0, spawn_yaw, 0],
                    "destination": [dx, dy, dz],
                    "behavior": {
                        "local_planner": {
                            "debug_trajectory": True,
                            "debug": True,
                        }
                    },
                    "v2x": {"communication_range": 45},
                }

                lidars = car.get("lidars", [])
                if lidars:
                    lidar = lidars[0]
                    cav["sensing"] = {
                        "perception": {
                            "activate": True,
                            "lidar": {
                                "channels":           lidar.get("channels", 32),
                                "range":              lidar.get("range", 50),
                                "rotation_frequency": lidar.get("rotation_frequency", 10),
                                "visualize": True,
                            }
                        }
                    }

                if car.get("max_speed"):
                    cav.setdefault("behavior", {})["max_speed"] = car["max_speed"]

                cav_list.append(cav)

        elif vehicle_type == "RSU":
            for i, rsu in enumerate(group["path"], 1):
                rx, ry, rz = convert_coords(
                    rsu["x"], rsu["y"], offset_x, offset_y,
                    carla_map=carla_map, is_spawn=True,
                )
                log.info("RSU%d spawn=(%.2f, %.2f, %.2f)", i, rx, ry, rz)

                rsu_entry = {
                    "name": f"rsu{i}",
                    "spawn_position": [rx, ry, rz, 0, 0, 0],
                    "id": i,
                    "v2x": {
                        "communication_range": rsu.get("range", 45),
                        "tx_power":            rsu.get("tx_power", 23),
                        "frequency":           rsu.get("frequency", 5.9e9),
                        "protocol":            rsu.get("protocol", "ITS-G5"),
                        "beacon_interval":     rsu.get("beacon_interval", 1000),
                    },
                    "sensing": {
                        "perception": {
                            "activate": rsu.get("opencda_perception_activate", False),
                            "camera": {
                                "visualize": rsu.get("opencda_camera_visualize", 4),
                                "num":       rsu.get("opencda_camera_num", 4),
                                "positions": rsu.get("opencda_camera_positions", [
                                    [2.5,  0.0,  1.0,   0],
                                    [0.0,  0.3,  1.8, 100],
                                    [0.0, -0.3,  1.8, -100],
                                    [-2.0, 0.0,  1.5, 180],
                                ]),
                            },
                            "lidar": {
                                "visualize":                  rsu.get("opencda_lidar_visualize", True),
                                "channels":                   rsu.get("opencda_lidar_channels", 32),
                                "range":                      rsu.get("opencda_lidar_range", 120),
                                "points_per_second":          rsu.get("opencda_lidar_points_per_second", 1000000),
                                "rotation_frequency":         rsu.get("opencda_lidar_rotation_frequency", 20),
                                "upper_fov":                  rsu.get("opencda_lidar_upper_fov", 2),
                                "lower_fov":                  rsu.get("opencda_lidar_lower_fov", -25),
                                "dropoff_general_rate":       rsu.get("opencda_lidar_dropoff_general_rate", 0.3),
                                "dropoff_intensity_limit":    rsu.get("opencda_lidar_dropoff_intensity_limit", 0.7),
                                "dropoff_zero_intensity":     rsu.get("opencda_lidar_dropoff_zero_intensity", 0.4),
                                "noise_stddev":               rsu.get("opencda_lidar_noise_stddev", 0.02),
                            },
                        },
                        "localization": {
                            "activate": rsu.get("opencda_localization_activate", True),
                            "dt": "${world.fixed_delta_seconds}",
                            "gnss": {
                                "noise_alt_stddev": rsu.get("opencda_gnss_noise_alt_stddev", 0.05),
                                "noise_lat_stddev": rsu.get("opencda_gnss_noise_lat_stddev", 3e-6),
                                "noise_lon_stddev": rsu.get("opencda_gnss_noise_lon_stddev", 3e-6),
                            },
                        },
                    },
                }
                rsu_list.append(rsu_entry)

        else:
            log.debug("Skipping unsupported vehicle type: %s", vehicle_type)

    scenario_section: dict = {
        "world": {
            "town": map_name,
        },
        "scenario": {
            "name":            json_data.get("scenario_name", "scenario"),
            "map":             map_name,
            "single_cav_list": cav_list,
        },
    }

    if rsu_list:
        scenario_section["scenario"]["rsu_list"] = rsu_list

    return scenario_section