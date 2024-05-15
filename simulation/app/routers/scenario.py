import datetime
import json
import sqlite3

from fastapi import APIRouter, BackgroundTasks, Request

from ..core.config import config
from ..tasks import work
from . import schemas, services

router = APIRouter()


@router.post("/create")
async def set_scenario(
    data: schemas.ScenarioSchema, request: Request, bacground_task: BackgroundTasks
):
    scenario_id = str(hash(str(data.model_dump()) + str(datetime.datetime.now())))[-10:]
    data_to_dump = data.model_dump()
    data_to_dump["scenario_id"] = scenario_id
    json.dump(data_to_dump, open(f"scenarios/{scenario_id}.json", "w"))
    return {"scenario_id": scenario_id, "status": "created"}


"""
id INTEGER PRIMARY KEY,
scenario_id TEXT,
scenario_name TEXT,
status BOOLEAN
"""


@router.get("/run/{_id}")
async def run_scenario(_id: str, bacground_task: BackgroundTasks, request: Request):
    carla_host = config.CARLA_HOST
    carla_port = config.CARLA_PORT

    connection = sqlite3.connect(config.SQLDB_NAME)
    cursor = connection.cursor()

    scenario = services.get_scenario(_id)

    # я осознаю что это sql инъекция, эта строчка написана в полном здравии и ясном уме
    query = f"INSERT INTO reports (scenario_id, scenario_name, status) VALUES ('{_id}', '{scenario['scenario_name']}', 'false')"

    inseted_value = cursor.execute(query)
    connection.commit()
    connection.close()

    data = json.load(open(f"scenarios/{_id}.json"))
    data = schemas.ScenarioSchema.parse_obj(data)

    bacground_task.add_task(
        work.do_scenario, carla_host, carla_port, data, _id, inseted_value.lastrowid
    )
    return "ok"


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


"""
{
  "weather": "string",
  "scenario": [
    {
      "vehicle": {
                "brand": "audi",
                "model": "a2"
            },
      "path": {
        "path": [
            {"x": -52.186737060546875, "y": 42.56512451171875, "z": 0.5999999642372131},
            {"x": -48.565467834472656, "y": 85.6451187133789, "z": 0.5999999642372131},
            {"x": -52.07392120361328, "y": 100.18904876708984, "z": 0.5999999642372131},
            {"x": -68.73516845703125, "y": 129.30384826660156, "z": 0.5999999642372131}
    
        ]
      }
    }
  ]
}



"""

"""
nums = [21, 105, 48, 52, 104]


for i in nums:
    qwe = str(a[i])
    qwe = qwe.replace("'", '"')
    print(qwe, end=",\n")


"""

"""
{
  "weather": "string",
  "scenario": [
    {
      "vehicle": {
                "brand": "audi",
                "model": "a2"
            },
      "path": {
        "path": [
{"x": 99.38441467285156, "y": -6.305729389190674, "z": 0.5999999642372131},
{"x": 83.07522583007812, "y": 13.414804458618164, "z": 0.5999999642372131},
{"x": 43.37312316894531, "y": 16.90922737121582, "z": 0.5999999642372131},
{"x": 15.143111228942871, "y": 16.681333541870117, "z": 0.699999988079071},
{"x": -17.10540199279785, "y": 13.25745677947998, "z": 0.5999999642372131},
{"x": -41.82510757446289, "y": -6.604220867156982, "z": 0.5999999642372131}
    
        ]
      }
    }
  ]
}



"""


"""
{
    "wheather": "string",
    "scenario": [
        {
            "vehicle": {
                "brand": "audi",
                "model": "a2"
            }
        },
        {
            "vehicle": {
                "brand": "nissan",
                "model": "micra"
            }
        }
    ]
}




"""
