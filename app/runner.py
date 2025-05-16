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

# OpenCDA
from ..opencda.opencda.core.common.cav_world import CavWorld
from ..opencda.opencda.scenario_testing.utils import customized_map_api as map_api
from ..opencda.opencda.scenario_testing.utils import sim_api
from ..opencda.opencda.scenario_testing.utils.yaml_utils import add_current_time
from ..opencda.opencda.scenario_testing.evaluations.evaluate_manager import (
    EvaluationManager,
)

XODR_PATH = "assets/xodrs"
CFG_DIR = "assets/opencda"


def run_scenario(scenario_params, params):
    apply_ml = params["apply_ml"]
    record = params["record"]
    map_name = params["map_name"]
    xodr_path = f"{XODR_PATH}/{map_name}.xodr"

    cav_world = CavWorld(apply_ml)
    scenario_manager = sim_api.ScenarioManager(
        scenario_params,
        apply_ml, #apply_ml
        "0.9.15", #version
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
        script_name=map_name,
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
        if record:
            scenario_manager.client.stop_recorder()

        scenario_manager.close()
        for v in single_cav_list + bg_veh_list:
            v.destroy()