from fastapi import APIRouter, Request

import carla

from . import schemas, services

router = APIRouter()

@router.get("/spawnpoints")
async def get_all_spawnpoints(request: Request):
    carla_client = request.app.state.client
    world = carla_client.get_world()

    spawnpoints = world.get_map().get_spawn_points()
    response = []
    for i in spawnpoints:
        location = i.location
        base = {"x": location.x, 
                "y": location.y, 
                "z": location.z}
        response.append(base)
    print(response)
    return response

# @router.get("/layers")
# async def set_layers(request: Request):
#     carla_client = request.app.state.client
#     world = carla_client.get_world()

#     layers = world.get_map().get_layers()
#     response = []
#     print(layers)
#     return layers

@router.post("/draw_path")
async def draw_path_handler(data: schemas.PathSchema, request: Request):
    carla_client = request.app.state.client
    world = carla_client.get_world()

    await services.draw_path(data.path, world)
    
    # spectator = world.get_spectator()
    # spectator.set_location(point)
    return "ok"

# @router.get("/vehicles")

'''
{
"path": [
    {"x": -52.186737060546875, "y": 42.56512451171875, "z": 0.5999999642372131},
    {"x": -48.565467834472656, "y": 85.6451187133789, "z": 0.5999999642372131},
    {"x": -52.07392120361328, "y": 100.18904876708984, "z": 0.5999999642372131},
    {"x": -68.73516845703125, "y": 129.30384826660156, "z": 0.5999999642372131}
    ]
}


'''

@router.get("/destroy")
async def destroy_actors(request: Request):
    carla_client = request.app.state.client
    world = carla_client.get_world()

    actors = world.get_actors()
    for i in actors:
        print(str(i))
        if "vehicle" in str(i):
            i.destroy()
    return "ok"
# 

# 108 122 24 106
