import yaml


def json_to_single_cav_list(json_data):
    cav_list = []
    rsu_list = []

    for group in json_data["scenario"]:
        vehicle_type = group["vehicle"]

        if vehicle_type == "car":
            for i, car in enumerate(group["path"], 1):
                points = car.get("points", [])
                dest = points[-1] if points else None
                cav = {
                    "name": f"cav{i}",
                    "spawn_position": [
                        car["x"], car["y"], car["z"],
                        0, car.get("rotation", 0), 0
                    ],
                    "destination": [
                        dest["x"], dest["y"], dest["z"]
                    ] if dest else [car["x"], car["y"], car["z"]],
                    "behavior": {
                        "local_planner": {
                            "debug_trajectory": True,
                            "debug": True,
                        }
                    },
                    "v2x": {"communication_range": 45},
                }
                cav_list.append(cav)

        elif vehicle_type == "RSU":
            for i, rsu in enumerate(group["path"], 1):
                rsu_entry = {
                    "name": f"rsu{i}",
                    "spawn_position": [
                        rsu["x"], rsu["y"], rsu["z"],
                        0, 0, 0
                    ],
                    "id": i,
                    "v2x": {
                        "communication_range": rsu.get("range", 45),
                        "tx_power": rsu.get("tx_power", 23),
                        "frequency": rsu.get("frequency", 5.9e9),
                        "protocol": rsu.get("protocol", "ITS-G5"),
                    }
                }
                rsu_list.append(rsu_entry)

    map_name = json_data.get("map", "Town10HD")

    scenario_section = {
        "scenario": {
            "name": json_data.get("scenario_name", "scenario"),
            "map": map_name,
            "single_cav_list": cav_list,
        }
    }

    if rsu_list:
        scenario_section["scenario"]["rsu_list"] = rsu_list

    return yaml.safe_dump(scenario_section, allow_unicode=True, sort_keys=False)