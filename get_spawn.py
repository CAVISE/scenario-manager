import carla
import random

client = carla.Client('localhost', 2000)
world = client.get_world()


spawn_points = world.get_map().get_spawn_points()[0]

print(spawn_points)