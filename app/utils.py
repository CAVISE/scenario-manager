import yaml

def json_to_single_cav_list(json_data):
    cav_list = []
    for i, vehicle in enumerate(json_data["scenario"], 1):
        path = vehicle["path"]
        spawn = path[0]
        dest = path[-1]
        cav = {
            "name": f"cav{i}",
            "spawn_position": [spawn["x"], spawn["y"], spawn["z"], 0, 0, 0],
            "destination": [dest["x"], dest["y"], dest["z"], 0, 0, 0],
            "behavior": {
                "local_planner": {
                    "debug_trajectory": True,
                    "debug": True
                }
            }
        }
        cav_list.append(cav)

    scenario_section = {
        "scenario": {
            "name": "multi_actor_scenario",
            "map": "Town10HD",
            "single_cav_list": cav_list
        }
    }
    return yaml.safe_dump(scenario_section, allow_unicode=True, sort_keys=False)
