import math
import logging
log = logging.getLogger(__name__)

MAP_OFFSETS = {
    'Town01':  (215, 124),
    'Town02':  (105, 2),
    'Town03':  (0, 0),
    'Town04':  (206, 163),
    'Town05':  (0, 0),
    'Town06':  (0, 0),
    'Town07':  (0, 0),
    'Town10HD': (8, 26),
}


def convert_coords(x, y, z, offset_x, offset_y, is_spawn=True):
    return [
        x + offset_x,
        -y + offset_y,
        (z + 1) if is_spawn else 0.0
    ]


def json_to_single_cav_list(json_data):
    if "scenario" not in json_data or not isinstance(json_data["scenario"], list):
        raise ValueError("Invalid payload: 'scenario' must be a list")

    cav_list = []
    rsu_list = []

    map_name = json_data.get("map", "Town10HD").replace(".xodr", "")
    offset_x, offset_y = MAP_OFFSETS.get(map_name, (0, 0))
    log.debug("map=%s offset_x=%s offset_y=%s", map_name, offset_x, offset_y)

    for group in json_data["scenario"]:
        vehicle_type = group["vehicle"]

        if vehicle_type == "car":
            for i, car in enumerate(group["path"], 1):
                points = car.get("points", [])
                dest = points[-1] if points else None

                sx, sy, sz = convert_coords(car["x"], car["y"], car["z"], offset_x, offset_y, is_spawn=True)
                if dest:
                    dx, dy, dz = convert_coords(dest["x"], dest["y"], dest["z"], offset_x, offset_y, is_spawn=False)
                else:
                    dx, dy, dz = sx, sy, sz

                log.info("CAV%d spawn=(%.2f, %.2f, %.2f) dest=(%.2f, %.2f, %.2f)", i, sx, sy, sz, dx, dy, dz)

                carla_dx = dx - sx
                carla_dy = dy - sy
                if abs(carla_dx) > 0.1 or abs(carla_dy) > 0.1:
                    spawn_yaw = math.degrees(math.atan2(carla_dy, carla_dx))
                else:
                    spawn_yaw = 0.0
                log.info("CAV%d auto-yaw=%.1f deg (dx=%.1f dy=%.1f)", i, spawn_yaw, carla_dx, carla_dy)

                cav = {
                    "name": f"cav{i}",
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
                                "channels": lidar.get("channels", 32),
                                "range": lidar.get("range", 50),
                                "rotation_frequency": lidar.get("rotation_frequency", 10),
                                "visualize": True,
                            }
                        }
                    }

                cav_list.append(cav)

        elif vehicle_type == "RSU":
            for i, rsu in enumerate(group["path"], 1):
                rx, ry, rz = convert_coords(rsu["x"], rsu["y"], rsu["z"], offset_x, offset_y)
                log.info("RSU%d spawn=(%.2f, %.2f, %.2f)", i, rx, ry, rz)

                rsu_entry = {
                    "name": f"rsu{i}",
                    "spawn_position": [rx, ry, rz, 0, 0, 0],
                    "id": i,
                    "v2x": {
                        "communication_range": rsu.get("range", 45),
                        "tx_power": rsu.get("tx_power", 23),
                        "frequency": rsu.get("frequency", 5.9e9),
                        "protocol": rsu.get("protocol", "ITS-G5"),
                        "beacon_interval": rsu.get("beacon_interval", 1000),
                    }
                }
                rsu_list.append(rsu_entry)

    scenario_section = {
        "world": {
            "town": map_name,
        },
        "scenario": {
            "name": json_data.get("scenario_name", "scenario"),
            "map": map_name,
            "single_cav_list": cav_list,
        }
    }

    if rsu_list:
        scenario_section["scenario"]["rsu_list"] = rsu_list

    return scenario_section