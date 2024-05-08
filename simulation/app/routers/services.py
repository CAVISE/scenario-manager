import carla
import math

from . import schemas

async def weather_setter(world, weather, intense: int = None):
    if weather == "clear":
        world.set_weather(carla.WeatherParameters.ClearNoon)
    elif weather == "cloudy":
        world.set_weather(carla.WeatherParameters.CloudyNoon)
    elif weather == "rain":
        world.set_weather(carla.WeatherParameters.WetNoon)
    elif weather == "night":
        world.set_weather(carla.WeatherParameters.WetNight)
    else:
        world.set_weather(carla.WeatherParameters.ClearNoon)

def calculate_pitch_yaw(point1: schemas.LocationSchema, point2: schemas.LocationSchema):
    # Разница координат между двумя точками
    dx = point2.x - point1.x
    dy = point2.y - point1.y
    dz = point2.z - point1.z
    
    # Расчет pitch
    pitch = math.atan2(dz, math.sqrt(dx**2 + dy**2))
    
    # Расчет yaw
    yaw = math.atan2(dy, dx)
    
    # Перевод углов из радианов в градусы для удобства
    pitch_degrees = math.degrees(pitch)
    yaw_degrees = math.degrees(yaw)
    
    return pitch_degrees, yaw_degrees

async def draw_path(path, world, tm: int = 20):
    for i, point in enumerate(path):
        point = carla.Location( 
            x = point.x,
            y = point.y,
            z = point.z)
        world.debug.draw_string(point, str(i), life_time=tm, color=carla.Color(255,0,0))