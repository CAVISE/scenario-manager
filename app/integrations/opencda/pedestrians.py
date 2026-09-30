"""CARLA pedestrian lifecycle helpers used by OpenCDA scenario runs."""

import random
from typing import Any

import carla
from opencda.core.common.pedestrian_manager import PedestrianManager

from app.log_config import get_logger

log = get_logger(__name__)


def spawn_pedestrians(world: Any, pedestrian_list: list, cav_world: Any) -> list:
    """Spawn walkers, attach controllers, and wrap them for OpenCDA V2X."""
    if not pedestrian_list:
        return []

    blueprint_library = world.get_blueprint_library()
    walker_blueprints = blueprint_library.filter("walker.pedestrian.*")
    controller_blueprint = blueprint_library.find("controller.ai.walker")
    spawned = []

    for index, pedestrian_config in enumerate(pedestrian_list, 1):
        px, py, pz = pedestrian_config["spawn"]
        walker_blueprint = random.choice(walker_blueprints)
        if walker_blueprint.has_attribute("is_invincible"):
            walker_blueprint.set_attribute(
                "is_invincible",
                "true" if pedestrian_config["is_invincible"] else "false",
            )

        spawn_transform = carla.Transform(carla.Location(x=px, y=py, z=pz + 0.5))
        walker = world.try_spawn_actor(walker_blueprint, spawn_transform)
        if walker is None:
            log.warning(
                "PED%d: spawn failed at (%.1f, %.1f, %.1f) — skipping",
                index,
                px,
                py,
                pz,
            )
            continue

        try:
            controller = world.spawn_actor(
                controller_blueprint,
                carla.Transform(),
                attach_to=walker,
            )
            world.tick()
            controller.start()
            controller.go_to_location(world.get_random_location_from_navigation())
            controller.set_max_speed(pedestrian_config["speed"])

            spawned.append(
                PedestrianManager(walker, controller, pedestrian_config, cav_world)
            )
            log.info(
                "PED%d spawned id=%d speed=%.1f m/s",
                index,
                walker.id,
                pedestrian_config["speed"],
            )
        except Exception as error:
            log.warning(
                "PED%d: controller setup failed (%s) — destroying orphaned "
                "walker, skipping this pedestrian",
                index,
                error,
            )
            try:
                walker.destroy()
            except Exception as destroy_error:
                log.warning(
                    "PED%d: also failed to destroy orphaned walker: %s",
                    index,
                    destroy_error,
                )

    log.info("Spawned %d/%d pedestrian(s)", len(spawned), len(pedestrian_list))
    return spawned


def destroy_pedestrians(spawned_pedestrians: list) -> None:
    """Stop controllers and destroy every pedestrian actor best-effort."""
    for pedestrian in spawned_pedestrians:
        try:
            pedestrian.controller.stop()
            pedestrian.controller.destroy()
        except Exception as error:
            log.warning("Failed to stop/destroy walker controller: %s", error)
        try:
            pedestrian.walker.destroy()
        except Exception as error:
            log.warning("Failed to destroy walker: %s", error)
