from fastapi import APIRouter, Request

import carla

from . import schemas, services

from ..core.config import config

router = APIRouter()


@router.post("/scenario")
async def set_scenario(data: schemas.ScenarioSchema, request: Request):
    carla_client = request.app.state.client
    world = carla_client.get_world()

    actors_data = [x.vehicle for x in data.scenario]
    actors = []
    bps = [x for x in world.get_blueprint_library()]

    for i in actors_data:
        actor_id = "vehicle." + i.brand + "." + i.model
        # actors.append(world.get_blueprint_library().find(actor_id)) # > VVV

        ###############
        for j in bps:
            if actor_id in str(j):
                actors.append(j)
                break
        ###############

    print(str(actors[0]))

    pitch, yaw = services.calculate_pitch_yaw(
        data.scenario[0].path.path[0], data.scenario[0].path.path[1]
    )
    roll = 0
    tmp_transform = carla.Transform(
        carla.Location(
            data.scenario[0].path.path[0].x,
            data.scenario[0].path.path[0].y,
            data.scenario[0].path.path[0].z,
        ),
        carla.Rotation(pitch, yaw, roll),
    )

    # tmp_vehicle = world.try_spawn_actor(actors[0], tmp_transform)

    traffic_manager = carla_client.get_trafficmanager()
    traffic_manager.set_random_device_seed(config.SEED)

    # tmp
    for i in range(len(data.scenario)):
        await services.draw_path(data.scenario[i].path.path, world, 50)
        path = [carla.Location(i.x, i.y, i.z) for i in data.scenario[i].path.path]

        pitch, yaw = services.calculate_pitch_yaw(
            data.scenario[0].path.path[0], data.scenario[0].path.path[1]
        )
        roll = 0

        first_transform = carla.Transform(
            carla.Location(
                data.scenario[i].path.path[0].x,
                data.scenario[i].path.path[0].y,
                data.scenario[i].path.path[0].z,
            ),
            carla.Rotation(pitch, yaw, roll),
        )

        print([str(x) for x in path])
        try:
            vehicle = world.spawn_actor(actors[i], first_transform)
            print(vehicle)
            vehicle.set_autopilot(True)

            traffic_manager.update_vehicle_lights(vehicle, True)
            traffic_manager.random_left_lanechange_percentage(vehicle, 50)
            traffic_manager.random_right_lanechange_percentage(vehicle, 50)
            traffic_manager.auto_lane_change(vehicle, True)
            traffic_manager.set_path(vehicle, path)

        except BaseException as _ex:
            print(_ex)

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

'''
nums = [21, 105, 48, 52, 104]


for i in nums:
    qwe = str(a[i])
    qwe = qwe.replace("'", '"')
    print(qwe, end=",\n")


'''

'''
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



'''


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
