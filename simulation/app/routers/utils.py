import random
from fastapi import APIRouter, Request

import carla

from . import schemas, services

router = APIRouter()


@router.get("/layers")
async def set_layers(layer_name: str, toggle: int, request: Request):
    client = request.app.state.client
    world = client.get_world()  # noqa: F841
    try:
        if toggle:
            exec(f"world.load_map_layer(carla.MapLayer.{layer_name})")
        else:
            exec(f"world.unload_map_layer(carla.MapLayer.{layer_name})")
    except BaseException as _ex:
        print(_ex)
    # layers = world.get_map().get_layers()

    return "ok"


@router.post("/draw_path")
async def draw_path_handler(data: schemas.PathSchema, request: Request):
    client = request.app.state.client
    world = client.get_world()

    services.draw_path(data.path, world)

    return "ok"


# @router.get("/vehicles")

"""
{
"path": [
    {"x": -52.186737060546875, "y": 42.56512451171875, "z": 0.5999999642372131},
    {"x": -48.565467834472656, "y": 85.6451187133789, "z": 0.5999999642372131},
    {"x": -52.07392120361328, "y": 100.18904876708984, "z": 0.5999999642372131},
    {"x": -68.73516845703125, "y": 129.30384826660156, "z": 0.5999999642372131}
    ]
}


"""


@router.get("/actors/get")
async def get_actors(request: Request):
    client = request.app.state.client
    world = client.get_world()

    actors = world.get_actors()
    response = []
    for i in actors:
        response.append(str(i))
    return response


@router.get("/actors/destroy")
async def destroy_actors(actor_type: str, request: Request):
    client = request.app.state.client
    world = client.get_world()

    actors = world.get_actors()
    print(actors)
    for i in actors:
        if actor_type in str(i):
            i.destroy()
    return "ok"


@router.get("/spectator/pos/get")
async def get_spectator_pos(request: Request):
    client = request.app.state.client
    world = client.get_world()

    spectator = world.get_spectator()
    location = spectator.get_location()
    response = {"x": location.x, "y": location.y, "z": location.z}
    return response


@router.post("/spectator/pos/set")
async def set_spectator_pos(data: schemas.TransformSchema, request: Request):
    client = request.app.state.client
    world = client.get_world()

    spectator = world.get_spectator()
    new_transoform = carla.Transform(
        carla.Location(data.x, data.y, data.z),
        carla.Rotation(data.pitch, data.yaw, data.roll),
    )
    spectator.set_transform(new_transoform)
    return "ok"


"""точно центр карты
{
  "x": -7,
  "y": 36,
  "z": 233,
  "pitch": -90,
  "yaw": 0,
  "roll": 0
}
"""


"""предположительный центр карты
{
    "path": [
        {  
            "x": -2.3158950805664062,
            "y": 36.14118576049805,
            "z": 230.0
        },
        {
            "x": 117.86033630371094,
            "y": 151.98765563964844,
            "z": 1.586620807647705
        },
        {
            "x": -123.13208770751953,
            "y": -76.73937225341797,
            "z": 0.9788720607757568
        }
    ]
}


"""


@router.get("/spectator/image")
async def get_spectator_image(request: Request):
    client = request.app.state.client
    world = client.get_world()

    spectator = world.get_spectator()

    spectator_transofm = spectator.get_transform()
    vehicle_blueprints = world.get_blueprint_library().filter("*vehicle*")
    ego_vehicle = world.spawn_actor(
        random.choice(vehicle_blueprints), spectator_transofm
    )
    camera_bp = world.get_blueprint_library().find("sensor.camera.rgb")
    camera = world.spawn_actor(camera_bp, attach_to=ego_vehicle)


    # camera.listen(lambda image: image.save_to_disk(f"output_{time_hash}.png"))
    camera.listen(lambda image: image.save_to_disk("output_.png"))
    return "ok"


@router.get("/world/weather/set")
async def set_weather(weather, request: Request):
    client = request.app.state.client
    world = client.get_world()

    await services.weather_setter(world, weather)
    return "ok"


# @router.get("/world/wheather/get")
# async def get_wheather():
#     wheathers = carla.WeatherParameters
#     print(wheathers)
#     return wheathers


# 108 122 24 106


sensors_list = []

spectator_sensor = None
image_exist = False


def image_callback(image):
    global image_exist
    if image_exist:
        spectator_sensor.destroy()
    image.save_to_disk(f"out/maps/{image.frame}.png")
    image_exist = True


@router.get("/map/image")
async def get_map_image(x: float, y: float, z: float, request: Request):
    client = request.app.state.client
    world = client.get_world()

    sensor_bp = world.get_blueprint_library().find("sensor.camera.rgb")
    sensor_bp.set_attribute("image_size_x", "2500")
    sensor_bp.set_attribute("image_size_y", "2500")
    sensor_bp.set_attribute("fov", "10")

    sensor_transform = carla.Transform(
        carla.Location(x=x, y=y, z=z), carla.Rotation(pitch=-90)
    )

    sensor = world.spawn_actor(sensor_bp, sensor_transform)
    print("Sensor created")
    sensors_list.append(sensor)
    global spectator_sensor
    spectator_sensor = sensor

    # sensor.listen(lambda image: image.save_to_disk(f'out/maps/{image.frame}.png'))
    sensor.listen(image_callback)
