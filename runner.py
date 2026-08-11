import argparse
import os
import sys
import threading

from omegaconf import OmegaConf
import carla

from opencda.core.common.cav_world import CavWorld
from opencda.scenario_testing.utils import customized_map_api as map_api
from opencda.scenario_testing.utils import sim_api
from opencda.scenario_testing.utils.yaml_utils import add_current_time
from opencda.scenario_testing.evaluations.evaluate_manager import EvaluationManager

XODR_PATH = "assets/xodrs"
CFG_DIR = "assets/opencda"
CARLA_HOST = os.getenv("CARLA_HOST", "localhost")
CARLA_PORT = int(os.getenv("CARLA_PORT", "2000"))
_stop_event = threading.Event()


def request_stop():
    _stop_event.set()


def arg_parse_default() -> argparse.Namespace:
    p = argparse.ArgumentParser("OpenCDA unified scenario runner")
    p.add_argument("-t", "--test_scenario", default="simple_verification")
    p.add_argument("-m", "--map", default="map10")
    p.add_argument("-v", "--version", default="0.9.15")
    p.add_argument("--record", action="store_true", default=False)
    p.add_argument("--apply_ml", action="store_true")
    p.add_argument("--max_ticks", type=int, default=3000)
    return p.parse_args()


def run_scenario(scenario_params, params):
    client = carla.Client(CARLA_HOST, CARLA_PORT)
    client.set_timeout(10.0)
    client.get_server_version()

    apply_ml = params["apply_ml"]
    record = params["record"]
    map_name = params["map_name"]
    max_ticks = params.get("max_ticks", 3000)
    xodr_path = f"{XODR_PATH}/{map_name}.xodr"
    if not os.path.exists(xodr_path):
        xodr_path = None
    _stop_event.clear()

    cav_world = CavWorld(apply_ml)
    scenario_manager = sim_api.ScenarioManager(
        scenario_params, apply_ml, "0.9.16",
        xodr_path=xodr_path,
        town=map_name if xodr_path is None else None,
        cav_world=cav_world,
    )
    single_cav_list = scenario_manager.create_vehicle_manager(
        application=["single"],
        map_helper=map_api.spawn_helper_2lanefree,
    )

    rsu_list = []
    scenario_section = OmegaConf.to_container(scenario_params, resolve=True)
    if scenario_section.get("scenario", {}).get("rsu_list"):
        rsu_list = scenario_manager.create_rsu_manager(data_dump=False)

    traffic_manager, bg_veh_list = scenario_manager.create_traffic_carla()

    eval_manager = EvaluationManager(
        scenario_manager.cav_world,
        script_name=map_name,
        current_time=scenario_params["current_time"],
    )

    try:
        tick_count = 0
        while tick_count < max_ticks and not _stop_event.is_set():
            scenario_manager.tick()
            for cav in single_cav_list:
                cav.update_info()
                cav.vehicle.apply_control(cav.run_step())
            tick_count += 1
    finally:
        eval_manager.evaluate()
        if record:
            scenario_manager.client.stop_recorder()
        for v in single_cav_list + bg_veh_list:
            try:
                v.destroy()
            except Exception:
                pass
        for rsu in rsu_list:
            try:
                rsu.rsu.destroy()
            except Exception:
                pass
        scenario_manager.close()


def main():
    opt = arg_parse_default()

    base_yaml = f"{CFG_DIR}/base.yaml"
    user_yaml = f"{CFG_DIR}/{opt.test_scenario}.yaml"

    if not os.path.isfile(user_yaml):
        sys.exit(f"YAML for scenario '{opt.test_scenario}' not found: {user_yaml}")

    base_dict = OmegaConf.load(base_yaml)
    scene_dict = OmegaConf.load(user_yaml)
    scene_dict = OmegaConf.merge(base_dict, scene_dict)
    scene_dict = add_current_time(scene_dict)

    params = {
        "apply_ml": opt.apply_ml,
        "record": opt.record,
        "map_name": opt.map,
        "max_ticks": opt.max_ticks,
    }
    run_scenario(scene_dict, params)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print(" - Exited by user.")
