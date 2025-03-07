import yaml
import opencda_playground
# функция для представления многострочных строк в стиле |-
def str_presenter(dumper, data):
    if "\n" in data:
        return dumper.represent_scalar("tag:yaml.org,2002:str", data, style="|-")
    return dumper.represent_scalar("tag:yaml.org,2002:str", data)

# класс-обёртка для списков, которые нужно вывести в одну строку
class FlowList(list):
    pass

def flowlist_representer(dumper, data):
    return dumper.represent_sequence('tag:yaml.org,2002:seq', data, flow_style=True)

yaml.add_representer(str, str_presenter)
yaml.add_representer(FlowList, flowlist_representer)

## name - любое имя сценария
## map - карта
## coord - координата машины в формате [x, y, z, x_rot, y_rot, z_rot], пример [107.0, -12.0, 0.3, 0, 0, 0]
def create_scenario(name, map, coord):
    data = {
        "description": (
            f"Автосгенерированный сценарий {name}, с карты {map}, с координатой машины {coord}\n"
        ),
        "world": {
            "sync_mode": True,
            "fixed_delta_seconds": 0.05,
            "seed": 42,
            "weather": {
                "cloudiness": 20,
                "precipitation": 0,
                "sun_altitude_angle": 60
            }
        },
        "scenario": {
            "name": name,
            "map": map,
            "single_cav_list": [
                {
                    "name": "cav1",
                    "spawn_position": FlowList(coord),
                    "destination": FlowList([107.0, -12.0, 0.3, 0, 0, 0]),
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
    
    with open(f"external_endpoints/config_yaml/{name}.yaml", "w", encoding="utf-8") as file:
        yaml.dump(data, file, allow_unicode=True, sort_keys=False)


if __name__ == "__main__":
    create_scenario("simple_verification", "map10", [-35, 138, 0.3, 0, 0, 0])
    opencda_playground.start_opencda("simple_verification")
