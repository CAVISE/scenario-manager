#!venv/bin/python3
import argparse
import os
import sys
from datetime import datetime
import tkinter

import carla
import matplotlib
import numpy as np

from omegaconf import OmegaConf

from opencda.core.common.cav_world import CavWorld
from opencda.scenario_testing.utils import customized_map_api as map_api
from opencda.scenario_testing.utils import sim_api
from opencda.scenario_testing.utils.yaml_utils import add_current_time
from opencda.scenario_testing.evaluations.evaluate_manager import (
    EvaluationManager,
)



def arg_parse_default() -> argparse.Namespace:
    p = argparse.ArgumentParser("OpenCDA unified scenario runner")
    p.add_argument(
        "-t",
        "--test_scenario",
        default="simple_verification",
        help="The name of the yaml script in config_yaml/",
    )
    p.add_argument("-m", "--map", default="map10", help="CARLA map")
    p.add_argument("-v", "--version", default="0.9.15", help="Simulator version CARLA")
    p.add_argument(
        "--record",
        action="store_true",
        help="Save a .log record of the simulation",
        default=False,
    )
    p.add_argument(
        "--apply_ml",
        action="store_true",
        help="Are ML/DL frameworks needed within the scenario?",
    )
    return p.parse_args()


XODR_PATH = "assets/xodrs"
CFG_DIR = "assets/opencda"


def run_scenario(opt: argparse.Namespace, scenario_params):
    xodr_path = f"{XODR_PATH}/{opt.map}.xodr"

    cav_world = CavWorld(opt.apply_ml)
    scenario_manager = sim_api.ScenarioManager(
        scenario_params,
        opt.apply_ml,
        opt.version,
        xodr_path=xodr_path,
        cav_world=cav_world,
    )

    single_cav_list = scenario_manager.create_vehicle_manager(
        application=["single"],
        map_helper=map_api.spawn_helper_2lanefree,
    )
    traffic_manager, bg_veh_list = scenario_manager.create_traffic_carla()

    eval_manager = EvaluationManager(
        scenario_manager.cav_world,
        script_name=opt.map,
        current_time=scenario_params["current_time"],
    )
    try:
        while True:
            scenario_manager.tick()
            for cav in single_cav_list:
                cav.update_info()
                cav.vehicle.apply_control(cav.run_step())
            
    finally:
        eval_manager.evaluate()
        if opt.record:
            scenario_manager.client.stop_recorder()

        scenario_manager.close()
        for v in single_cav_list + bg_veh_list:
            v.destroy()


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

    run_scenario(opt, scene_dict)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print(" - Exited by user.")