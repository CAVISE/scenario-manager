import time
import carla
from ..routers import schemas, services
from ..core.config import config
from celery import Celery
import datetime
import math

celery = Celery("tasks", broker=f"redis://{config.REDIS_HOST}:{config.REDIS_PORT}/0")


sensor_list = []
actors_list = []


def has_reached_destination(vehicle, destination, threshold=1.0):
    print("IN IF")
    vehicle_location = vehicle.get_location()
    destination = destination.path[-1]

    vehicle_x, vehicle_y = vehicle_location.x, vehicle_location.y
    destination_x, destination_y = destination.x, destination.y

    distance = math.dist([vehicle_x, vehicle_y], [destination_x, destination_y])



    print(vehicle_location)
    print(destination)
    print("===================")
    return distance <= threshold

@celery.task
def do_scenario(carla_host, carla_port, data: schemas.ScenarioSchema, scenario_id):
    client = carla.Client(carla_host, carla_port)
    world = client.get_world()
    actors_data = [x.vehicle for x in data.scenario]
    actors = []
    bps = [x for x in world.get_blueprint_library()]

    for i in actors_data:
        actor_id = "vehicle." + i
        # actors.append(world.get_blueprint_library().find(actor_id)) # > VVV

        ###############
        for j in bps:
            if actor_id in str(j):
                actors.append(j)
                break
        ###############


    pitch, yaw = services.calculate_pitch_yaw(
        data.scenario[0].path[0], data.scenario[0].path[1]
    )
    roll = 0
    tmp_transform = carla.Transform(
        carla.Location(
            data.scenario[0].path[0].x,
            data.scenario[0].path[0].y,
            data.scenario[0].path[0].z,
        ),
        carla.Rotation(pitch, yaw, roll),
    )

    # tmp_vehicle = world.try_spawn_actor(actors[0], tmp_transform)

    traffic_manager = client.get_trafficmanager()
    traffic_manager.set_random_device_seed(config.SEED)


    # tmp
    for i in range(len(data.scenario)):
        services.draw_path(data.scenario[i].path, world, 50)
        path = [carla.Location(i.x, i.y, i.z) for i in data.scenario[i].path]

        pitch, yaw = services.calculate_pitch_yaw(
            data.scenario[0].path[0], data.scenario[0].path[1]
        )
        roll = 0

        first_transform = carla.Transform(
            carla.Location(
                data.scenario[i].path[0].x,
                data.scenario[i].path[0].y,
                data.scenario[i].path[0].z,
            ),
            carla.Rotation(pitch, yaw, roll),
        )

        print([str(x) for x in path])
        try:
            vehicle = world.spawn_actor(actors[i], first_transform)
            print(vehicle)
            actors_list.append(vehicle)
            vehicle.set_autopilot(True)

            traffic_manager.update_vehicle_lights(vehicle, True)
            traffic_manager.random_left_lanechange_percentage(vehicle, 50)
            traffic_manager.random_right_lanechange_percentage(vehicle, 50)
            traffic_manager.auto_lane_change(vehicle, True)
            traffic_manager.set_path(vehicle, path)

        except BaseException as _ex:
            print(_ex)
    try:
        for i in actors_list:
            camera_init_trans = carla.Transform(carla.Location(x=1.6, z=1.7))
            camera_bp = world.get_blueprint_library().find('sensor.camera.rgb')
            sensor = world.spawn_actor(camera_bp, camera_init_trans, attach_to=i)
            sensor_path = scenario_id + str(len(sensor_list)+1)
            sensor.listen(lambda image: image.save_to_disk(f'out/{sensor_path}/{image.frame}.png'))
            sensor_list.append(sensor)

        while actors_list:
            time.sleep(1)
            for i, vehicle in enumerate(actors_list):
                print("BEFORE IF")
                print(vehicle)
                print(data.scenario[i])
                if has_reached_destination(vehicle, data.scenario[i]):
                    vehicle.destroy()
                    actors_list.remove(vehicle)
                    for sensor in sensor_list:
                        if sensor.parent == vehicle:
                            sensor.destroy()
                            sensor_list.remove(sensor)
                            break
    finally:
        for actor in actors_list:
            actor.destroy()
        for sensor in sensor_list:
            sensor.destroy()
    print("123")



