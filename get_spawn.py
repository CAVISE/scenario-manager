import carla
import random

# Connect to the client and retrieve the world object
client = carla.Client('localhost', 2000)
world = client.get_world()


spawn_points = world.get_map().get_spawn_points()[0]

print(spawn_points)