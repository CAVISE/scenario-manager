from fastapi.routing import APIRouter
from omegaconf import OmegaConf
from fastapi import BackgroundTasks

from opencda.scenario_testing.utils.yaml_utils import add_current_time
from app import runner, utils

router = APIRouter()


XODR_PATH = "assets/xodrs"
CFG_DIR = "assets/opencda"


@router.post("/start_opencda")
async def start_opencda(scenario_raw: dict, background_tasks: BackgroundTasks):
    base_yaml = f"{CFG_DIR}/base.yaml"
    # user_yaml = f"{CFG_DIR}/{opt.test_scenario}.yaml"

    scenario = utils.json_to_single_cav_list(scenario_raw)
    base_dict = OmegaConf.load(base_yaml)

    scenario_dict = OmegaConf.create(scenario)
    scene_dict = OmegaConf.merge(base_dict, scenario_dict)
    scene_dict = add_current_time(scene_dict)

    print(scene_dict)
    # return tmp

    params = {
        "apply_ml": False,
        "record": False,
        "map_name": "town10",
    }

    # runner.run_scenario(scene_dict, params)
    background_tasks.add_task(runner.run_scenario, scene_dict, params)

    return scenario
    # run_scenario(opt, scenario_raw)
