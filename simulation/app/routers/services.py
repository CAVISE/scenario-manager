import json
import carla
import math

from . import schemas

weathers = {
    "ClearNoon": carla.WeatherParameters.ClearNoon,
    "CloudyNoon": carla.WeatherParameters.CloudyNoon,
    "WetNoon": carla.WeatherParameters.WetNoon,
    "WetCloudyNoon": carla.WeatherParameters.WetCloudyNoon,
    "SoftRainNoon": carla.WeatherParameters.SoftRainNoon,
    "MidRainyNoon": carla.WeatherParameters.MidRainyNoon,
    "HardRainNoon": carla.WeatherParameters.HardRainNoon,
    "ClearSunset": carla.WeatherParameters.ClearSunset,
    "CloudySunset": carla.WeatherParameters.CloudySunset,
    "WetSunset": carla.WeatherParameters.WetSunset,
    "WetCloudySunset": carla.WeatherParameters.WetCloudySunset,
    "SoftRainSunset": carla.WeatherParameters.SoftRainSunset,
    "MidRainSunset": carla.WeatherParameters.MidRainSunset,
    "HardRainSunset": carla.WeatherParameters.HardRainSunset,
}


def weather_setter(world, weather: str, intense: int = None):
    world.set_weather(weathers[weather])


def calculate_pitch_yaw(point1: schemas.LocationSchema, point2: schemas.LocationSchema):
    dx = point2.x - point1.x
    dy = point2.y - point1.y
    dz = point2.z - point1.z

    pitch = math.atan2(dz, math.sqrt(dx**2 + dy**2))

    yaw = math.atan2(dy, dx)

    pitch_degrees = math.degrees(pitch)
    yaw_degrees = math.degrees(yaw)

    return pitch_degrees, yaw_degrees


def draw_path(path, world, tm: int = 20):
    for i, point in enumerate(path):
        point = carla.Location(x=point.x, y=point.y, z=point.z)
        world.debug.draw_string(point, str(i), life_time=tm, color=carla.Color(255, 0, 0))


def get_scenario(_id):
    return json.load(open(f"scenarios/{_id}.json"))
