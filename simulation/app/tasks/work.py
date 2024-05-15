import asyncio
import math
import sqlite3

import carla
from celery import Celery

from ..core.config import config
from ..routers import schemas, services

celery = Celery("tasks", broker=f"redis://{config.REDIS_HOST}:{config.REDIS_PORT}/0")


def has_reached_destination(vehicle, destination, threshold=7.0):
    # print("IN IF")
    vehicle_location = vehicle.get_location()
    destination = destination.path[-1]

    vehicle_x, vehicle_y = vehicle_location.x, vehicle_location.y
    destination_x, destination_y = destination.x, destination.y

    distance = math.dist([vehicle_x, vehicle_y], [destination_x, destination_y])

    return distance <= threshold


@celery.task
def do_scenario(
    carla_host, carla_port, data: schemas.ScenarioSchema, scenario_id, report_id
):
    sensor_list = []
    actors_list = []
    client = carla.Client(carla_host, carla_port)
    world = client.get_world()
    actors_data = [x.vehicle for x in data.scenario]
    actors = []
    bps = [x for x in world.get_blueprint_library()]

    for elem in actors_data:
        actor_id = "vehicle." + elem
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
    tmp_transform = carla.Transform(  # noqa: F841
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
    for elem in range(len(data.scenario)):
        services.draw_path(data.scenario[elem].path, world, 50)
        path = [carla.Location(i.x, i.y, i.z) for i in data.scenario[elem].path]

        pitch, yaw = services.calculate_pitch_yaw(
            data.scenario[0].path[0], data.scenario[0].path[1]
        )
        roll = 0

        first_transform = carla.Transform(
            carla.Location(
                data.scenario[elem].path[0].x,
                data.scenario[elem].path[0].y,
                data.scenario[elem].path[0].z,
            ),
            carla.Rotation(pitch, yaw, roll),
        )

        print([str(x) for x in path])
        try:
            vehicle = world.spawn_actor(actors[elem], first_transform)
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
        for i, elem in enumerate(actors_list):
            camera_init_trans = carla.Transform(carla.Location(x=1.6, z=1.7))
            camera_bp = world.get_blueprint_library().find("sensor.camera.rgb")
            sensor = world.try_spawn_actor(camera_bp, camera_init_trans, attach_to=elem)
            # sensor_path = scenario_id + str(len(sensor_list)+1)
            sensor.listen(
                lambda image: image.save_to_disk(
                    f"out/{scenario_id}/{i}/{image.frame}.png"
                )
            )
            sensor_list.append(sensor)

        while actors_list:
            all_actors = world.get_actors()
            qwe = [i for i in all_actors if "vehicle" in str(i)]
            if qwe == 0:
                break
            asyncio.sleep(1)
            for elem, vehicle in enumerate(actors_list):
                # print("BEFORE IF")
                # print(vehicle)
                # print(data.scenario[i])
                if has_reached_destination(vehicle, data.scenario[elem]):
                    vehicle.destroy()
                    actors_list.remove(vehicle)
                    for sensor in sensor_list:
                        if sensor.parent == vehicle:
                            sensor.destroy()
                            sensor_list.remove(sensor)
                            break
    finally:
        for actor in actors_list:
            try:
                actor.destroy()
            except:
                pass
        for sensor in sensor_list:
            try:
                sensor.destroy()
            except:
                pass
    print("сценарий завершился")
    connection = sqlite3.connect(config.SQLDB_NAME)
    cursor = connection.cursor()
    query = f"UPDATE {config.SQLDB_TABLE} SET status='true' WHERE id={report_id}"
    cursor.execute(query)
    connection.commit()
    connection.close()
    print("данные сценария записаны")
