from fastapi import APIRouter, Request

import carla

from . import schemas

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

@router.get("/layers")
async def set_layers(request: Request):
    carla_client = request.app.state.client
    world = carla_client.get_world()

    layers = world.get_map().get_layers()
    response = []
    print(layers)
    return layers

@router.post("/draw_path")
async def draw_path(data: schemas.PathSchema, request: Request):
    carla_client = request.app.state.client
    world = carla_client.get_world()

    for i, point in enumerate(data.path):
        point = carla.Location( 
            x = point.x,
            y = point.y,
            z = point.z)
        world.debug.draw_string(point, str(i), life_time=100)
    # In synchronous mode, we need to run the simulation to fly the spectator

    return "ok"


# 108 122 24 106
