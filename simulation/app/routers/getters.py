from fastapi import APIRouter, Request

import carla

router = APIRouter()


@router.get("/vehicles")
async def get_vehicles(request: Request):
    carla_client = request.app.state.client
    world = carla_client.get_world()

    vehicle_blueprints = world.get_blueprint_library().filter('vehicle')
    tags = []
    for i in vehicle_blueprints:
        tags.append(i.tags)
    # tag = [lambda x: x.tags for x in vehicle_blueprints]
    print(tags)
    return tags
    # for blueprint in vehicle_blueprints:
    #     vehicle = world.spawn_actor(blueprint, transform)