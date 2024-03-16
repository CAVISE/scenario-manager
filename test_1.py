import carla
import random
import time
import os

def main():
    # Connect to the CARLA server
    client = carla.Client('localhost', 2000)
    client.set_timeout(10.0)

    # Get the world and settings
    world = client.get_world()
    settings = world.get_settings()
    original_settings = settings

    try:
        # Ensure synchronous mode for recording
        settings.synchronous_mode = True
        settings.fixed_delta_seconds = 0.05
        world.apply_settings(settings)

        # Choose a spawn point
        spawn_points = world.get_map().get_spawn_points()
        spawn_point = random.choice(spawn_points) if spawn_points else carla.Transform()

        # Spawn a vehicle
        blueprint_library = world.get_blueprint_library()
        vehicle_bp = random.choice(blueprint_library.filter('vehicle.*'))
        vehicle = world.spawn_actor(vehicle_bp, spawn_point)

        # Enable autopilot for the vehicle
        vehicle.set_autopilot(True)

        # Set up and start recording
        client.start_recorder('recording01.log')

        # Run the simulation for a set time to record
        simulation_time = 10 # seconds
        start_time = time.time()
        while time.time() - start_time < simulation_time:
            world.tick()

    finally:
        # Stop recording
        client.stop_recorder()

        # Reset the world settings
        world.apply_settings(original_settings)

        # Destroy the vehicle
        vehicle.destroy()

if __name__ == '__main__':
    main()
