from fastapi import APIRouter, Request

import carla

router = APIRouter()


@router.get("/vehicles")
async def get_vehicles(request: Request):
    client = request.app.state.client
    world = client.get_world()

    vehicle_blueprints = world.get_blueprint_library().filter("vehicle")
    tags = []
    for i in vehicle_blueprints:
        tags.append(i.tags)
    # tag = [lambda x: x.tags for x in vehicle_blueprints]
    print(tags)
    return tags
    # for blueprint in vehicle_blueprints:
    #     vehicle = world.spawn_actor(blueprint, transform)


@router.get("/spawnpoints")
async def get_all_spawnpoints(request: Request):
    client = request.app.state.client
    world = client.get_world()

    spawnpoints = world.get_map().get_spawn_points()
    response = []
    for i in spawnpoints:
        location = i.location
        base = {"x": location.x, "y": location.y, "z": location.z}
        response.append(base)
    print(response)
    return response
