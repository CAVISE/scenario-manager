import datetime
import json
import sqlite3

from fastapi import APIRouter, BackgroundTasks, Request

from ..core.config import config
from ..tasks import work
from . import schemas, services

router = APIRouter()


@router.post("/create")
async def set_scenario(data: schemas.ScenarioSchema):
    scenario_id = str(hash(str(data.model_dump()) + str(datetime.datetime.now())))[-10:]
    data_to_dump = data.model_dump()
    data_to_dump["scenario_id"] = scenario_id
    json.dump(data_to_dump, open(f"scenarios/{scenario_id}.json", "w"))
    return {"scenario_id": scenario_id, "status": "created"}


@router.get("/run/{_id}")
async def run_scenario(_id: str, bacground_task: BackgroundTasks, request: Request):
    carla_host = config.CARLA_HOST
    carla_port = config.CARLA_PORT

    connection = sqlite3.connect(config.SQLDB_NAME)
    cursor = connection.cursor()

    scenario = services.get_scenario(_id)

    query = f"INSERT INTO reports (scenario_id, scenario_name, status) VALUES ('{_id}', '{scenario['scenario_name']}', 'false')"

    inseted_value = cursor.execute(query)
    connection.commit()
    connection.close()

    data = json.load(open(f"scenarios/{_id}.json"))
    data = schemas.ScenarioSchema.parse_obj(data)

    bacground_task.add_task(work.do_scenario, carla_host, carla_port, data, _id, inseted_value.lastrowid)
    # work.do_scenario.delay(carla_host, carla_port, data, _id, inseted_value.lastrowid)


@router.get("/all")
async def get_all_scenarios():
    import os

    scenarios = os.listdir("scenarios")
    print(scenarios)
    resp = []
    for i in scenarios:
        resp.append(json.load(open(f"scenarios/{i}")))
    return resp
    # return scenarios


@router.get("/{_id}")
async def get_scenario(_id: str):
    return json.load(open(f"scenarios/{_id}.json"))


@router.post("/edit")
async def edit_scenario(data: schemas.ScenarioSchema):
    scenario_id = data.scenario_id
    json.dump(data.model_dump(), open(f"scenarios/{scenario_id}.json", "w"))
    return "ok"
