import yaml
import opencda_playground


def str_presenter(dumper, data):
    if "\n" in data:
        return dumper.represent_scalar("tag:yaml.org,2002:str", data, style="|-")
    return dumper.represent_scalar("tag:yaml.org,2002:str", data)



class FlowList(list):
    pass


def flowlist_representer(dumper, data):
    return dumper.represent_sequence('tag:yaml.org,2002:seq', data, flow_style=True)


yaml.add_representer(str, str_presenter)
yaml.add_representer(FlowList, flowlist_representer)



def create_scenario(name, map, coord, destination):
    if len(coord) != len(destination):
        print(f"ERROR: length of coords is not equal to destination (len(coord) = {len(coord)}, len(destination) = {len(destination)})")
        return 1
    data = {
        "description": (
            f"Автосгенерированный сценарий {name}, с карты {map}, с с количеством машин {len(coord)}\n"
        ),
        "world": {
            "sync_mode": True,
            "fixed_delta_seconds": 0.05,
            "seed": 42,
            "weather": {
                "cloudiness": 80,
                "precipitation": 80,
                "sun_altitude_angle": 60
            }
        },
        "scenario": {
            "name": name,
            "map": map,
            "single_cav_list": [
            ]
        },
        "traffic_manager": {
            "global_distance_to_leading_vehicle": 5.0,
            "synchronous_mode": True
        },
        "background_vehicles": {
            "number": 10,
            "autopilot": True
        }
    }

    print()
    for i in range(len(coord)):
        temp = {
            "name": f"cav{i}",
            "spawn_position": FlowList(coord[i]),
            "destination": FlowList(destination[i]),
            "v2x": {
                "communication_range": 45
            },
            "behavior": {
                "local_planner": {
                    "debug_trajectory": True,
                    "debug": True
                }
            }
        }
        data["scenario"]["single_cav_list"].append(temp)
    with open(f"external_endpoints/config_yaml/{name}.yaml", "w", encoding="utf-8") as file:
        yaml.dump(data, file, allow_unicode=True, sort_keys=False)


if __name__ == "__main__":
    coords = [
        [-35, 67, 0.3, 0, 0, 0],
        [187.0, -84.0, 0.8, 0, 0, 0],
    ]
    dest = [
        [187.0, -84.0, 0.8, 0, 0, 0],
        [-35, 67, 0.3, 0, 0, 0],
    ]
    create_scenario("simple_verification", "map10", coords, dest)
    opencda_playground.start_opencda("simple_verification", map="map10")
