import carla
import random

# Connect to the client and retrieve the world object
client = carla.Client('localhost', 2000)
world = client.get_world()

# while True:
#     spectator = world.get_spectator()

#     # Get the location and rotation of the spectator through its transform
#     transform = spectator.get_transform()

#     location = transform.location
#     rotation = transform.rotation

#     print(f"{str(location)=}\n{str(rotation)=}")

#     # Set the spectator with an empty transform
#     # spectator.set_transform(carla.Transform())

spectator = world.get_spectator()

# Get the location and rotation of the spectator through its transform
transform = spectator.get_transform()

location = carla.Location(x=-30, y=15, z=1.5)
rotation = carla.Rotation(pitch=0, yaw=-180, roll=0)
spectator.set_transform(carla.Transform(location, rotation))




# Set the spectator with an empty transform
# spectator.set_transform(carla.Transform())


