import os
import random
import threading
from dotenv import load_dotenv
from omegaconf import OmegaConf
import carla

# QT_QPA_PLATFORM=offscreen was removed — opencv-python-headless has no Qt
# dependency, so no platform-plugin lookup occurs at all.

_BASE_DIR = os.path.dirname(os.path.abspath(__file__))
XODR_PATH = os.path.join(_BASE_DIR, "..", "assets", "xodrs")
CFG_DIR   = os.path.join(_BASE_DIR, "..", "assets", "opencda")
load_dotenv(".env.local")
CARLA_HOST = os.getenv("CARLA_HOST", "localhost")
CARLA_PORT = int(os.getenv("CARLA_PORT", "2000"))
_stop_event = threading.Event()

from app.log_config import get_logger
log = get_logger(__name__)

from opencda.core.common.cav_world import CavWorld
from opencda.scenario_testing.utils import customized_map_api as map_api
from opencda.scenario_testing.utils import sim_api
from opencda.scenario_testing.utils.yaml_utils import add_current_time
from opencda.scenario_testing.evaluations.evaluate_manager import EvaluationManager
from app.config import get_settings
from app import utils

STANDARD_MAPS = {
    'Town01', 'Town02', 'Town03', 'Town04', 'Town05',
    'Town06', 'Town07', 'Town10HD', 'Town11', 'Town12',
}


def request_stop():
    _stop_event.set()


def _build_scene_dict(scenario_raw: dict, carla_map=None) -> tuple:
    """
    Convert the raw frontend payload to a fully-merged OmegaConf scene dict.

    When carla_map is provided, spawn yaw values are taken from road waypoints
    (accurate).  On the first call carla_map is None and yaw falls back to the
    atan2 heuristic — that dict is used only to boot ScenarioManager so we can
    obtain the real carla.Map; it is then discarded.
    """
    settings = get_settings()
    base_dict = OmegaConf.load(settings.cfg_dir / "base.yaml")
    scenario_section, pedestrian_list = utils.json_to_single_cav_list(scenario_raw, carla_map=carla_map)
    scene_dict = OmegaConf.merge(base_dict, OmegaConf.create(scenario_section))
    return scene_dict, pedestrian_list


def _make_scenario_manager(scene_dict, apply_ml: bool, xodr_path, map_name: str,
                            cav_world: CavWorld) -> sim_api.ScenarioManager:
    return sim_api.ScenarioManager(
        scene_dict,
        apply_ml,
        "0.9.16",
        xodr_path=xodr_path,
        town=map_name if xodr_path is None else None,
        cav_world=cav_world,
    )


def _spawn_pedestrians(world, pedestrian_list: list) -> list:
    """
    Spawn Walker actors with AI controllers.
    Returns list of (walker, controller) tuples for cleanup.
    """
    if not pedestrian_list:
        return []

    bp_lib = world.get_blueprint_library()
    walker_bps = bp_lib.filter("walker.pedestrian.*")
    controller_bp = bp_lib.find("controller.ai.walker")
    spawned = []

    for i, ped in enumerate(pedestrian_list, 1):
        px, py, pz = ped["spawn"]
        bp = random.choice(walker_bps)
        if bp.has_attribute("is_invincible"):
            bp.set_attribute("is_invincible", "true" if ped["is_invincible"] else "false")

        spawn_tf = carla.Transform(carla.Location(x=px, y=py, z=pz + 0.5))
        walker = world.try_spawn_actor(bp, spawn_tf)
        if walker is None:
            log.warning("PED%d: spawn failed at (%.1f, %.1f, %.1f) — skipping", i, px, py, pz)
            continue

        ctrl = world.spawn_actor(controller_bp, carla.Transform(), attach_to=walker)
        world.tick()
        ctrl.start()
        ctrl.go_to_location(world.get_random_location_from_navigation())
        ctrl.set_max_speed(ped["speed"])
        spawned.append((walker, ctrl))
        log.info("PED%d spawned id=%d speed=%.1f m/s", i, walker.id, ped["speed"])

    log.info("Spawned %d/%d pedestrian(s)", len(spawned), len(pedestrian_list))
    return spawned


def _destroy_pedestrians(spawned_pedestrians: list) -> None:
    for walker, ctrl in spawned_pedestrians:
        try:
            ctrl.stop()
            ctrl.destroy()
        except Exception as e:
            log.warning("Failed to stop/destroy walker controller: %s", e)
        try:
            walker.destroy()
        except Exception as e:
            log.warning("Failed to destroy walker: %s", e)


def run_scenario(scenario_raw: dict, params: dict):
    apply_ml  = params["apply_ml"]
    record    = params["record"]
    map_name  = params["map_name"]
    max_ticks = params.get("max_ticks", 3000)
    current_time = params["current_time"]

    log.info("=== run_scenario START | map=%s max_ticks=%d carla=%s:%d ===",
             map_name, max_ticks, CARLA_HOST, CARLA_PORT)

    xodr_path = os.path.join(XODR_PATH, f"{map_name}.xodr")
    if not os.path.exists(xodr_path) or map_name in STANDARD_MAPS:
        xodr_path = None
    log.debug("xodr_path=%s", xodr_path)

    _stop_event.clear()

    log.info("Connecting to CARLA %s:%d ...", CARLA_HOST, CARLA_PORT)
    client = carla.Client(CARLA_HOST, CARLA_PORT)
    client.set_timeout(10.0)
    log.info("CARLA server version: %s", client.get_server_version())

    # ── Load map once ─────────────────────────────────────────────────────────
    log.info("Loading map once via client: %s ...", map_name)
    if xodr_path:
        with open(xodr_path) as f:
            client.generate_opendrive_world(f.read())
    else:
        client.load_world(map_name)

    carla_map = client.get_world().get_map()
    log.info("carla_map obtained: %s", carla_map.name)

    cav_world = CavWorld(apply_ml)
    scene_dict, pedestrian_list = _build_scene_dict(scenario_raw, carla_map=carla_map)

    # Add current_time directly into the OmegaConf struct — no roundtrip needed.
    # to_container(resolve=False) + OmegaConf.create() breaks interpolations like
    # ${world.fixed_delta_seconds} because the new DictConfig loses the full world section.
    OmegaConf.update(scene_dict, "current_time", current_time, merge=False)

    scenario_manager = _make_scenario_manager(
        scene_dict, apply_ml, xodr_path=None, map_name=None, cav_world=cav_world
    )
    log.info("ScenarioManager ready | map loaded: %s", map_name)

    # ── Spawn CAVs ────────────────────────────────────────────────────────────
    log.info("Spawning CAVs ...")
    single_cav_list = scenario_manager.create_vehicle_manager(
        application=["single"],
        map_helper=map_api.spawn_helper_2lanefree if xodr_path else None,
    )
    log.info("Spawned %d CAV(s)", len(single_cav_list))
    for i, cav in enumerate(single_cav_list):
        loc  = cav.vehicle.get_location()
        dest = (cav.agent.end_waypoint.transform.location
                if hasattr(cav, "agent") and cav.agent
                   and hasattr(cav.agent, "end_waypoint")
                else None)
        log.info("  CAV[%d] id=%d spawn=(%.1f, %.1f, %.1f) dest=%s",
                 i, cav.vehicle.id, loc.x, loc.y, loc.z,
                 f"({dest.x:.1f}, {dest.y:.1f})" if dest else "unknown")

    if single_cav_list:
        locs     = [cav.vehicle.get_location() for cav in single_cav_list]
        center_x = sum(l.x for l in locs) / len(locs)
        center_y = sum(l.y for l in locs) / len(locs)
        spectator = scenario_manager.world.get_spectator()
        spectator.set_transform(carla.Transform(
            carla.Location(x=center_x, y=center_y, z=500),
            carla.Rotation(pitch=-90)
        ))
        log.debug("Spectator set to center (%.1f, %.1f, z=500)", center_x, center_y)

    # ── Spawn RSUs ────────────────────────────────────────────────────────────
    rsu_list = []
    scene_container = OmegaConf.to_container(scene_dict, resolve=True)
    if scene_container.get("scenario", {}).get("rsu_list"):
        rsu_list = scenario_manager.create_rsu_manager(data_dump=False)
        log.info("Spawned %d RSU(s)", len(rsu_list))

    # ── Background traffic ────────────────────────────────────────────────────
    log.info("Creating background traffic ...")
    traffic_manager, bg_veh_list = scenario_manager.create_traffic_carla()
    log.info("Background vehicles: %d", len(bg_veh_list))

    # ── Pedestrians ───────────────────────────────────────────────────────────
    spawned_pedestrians = _spawn_pedestrians(scenario_manager.world, pedestrian_list)

    # ── Evaluation manager ────────────────────────────────────────────────────
    eval_manager = EvaluationManager(
        scenario_manager.cav_world,
        script_name=map_name,
        current_time=current_time,
    )

    spectator = scenario_manager.world.get_spectator()

    # ── Simulation loop ───────────────────────────────────────────────────────
    log.info("Simulation loop starting (max_ticks=%d) ...", max_ticks)
    tick_count = 0
    log_interval = max(1, max_ticks // 20)

    try:
        stop_reason = "max_ticks"
        finished_ids: set = set()

        while tick_count < max_ticks and not _stop_event.is_set():
            scenario_manager.tick()

            active_cavs = [c for c in single_cav_list if c.vehicle.id not in finished_ids]

            # Tick RSUs first — so their detected_objects are fresh
            # when CAV V2XManager merges perception in update_info().
            for rsu in rsu_list:
                try:
                    rsu.update_info()
                except Exception as _rsu_err:
                    log.debug("RSU id=%d update_info: %s", rsu.rid, _rsu_err)

            # Follow camera
            if active_cavs:
                locs   = [cav.vehicle.get_location() for cav in active_cavs]
                cx     = sum(l.x for l in locs) / len(locs)
                cy     = sum(l.y for l in locs) / len(locs)
                spread = max(
                    max(l.x for l in locs) - min(l.x for l in locs),
                    max(l.y for l in locs) - min(l.y for l in locs),
                )
                z = max(80, spread * 1.2)
                spectator.set_transform(carla.Transform(
                    carla.Location(x=cx, y=cy, z=z),
                    carla.Rotation(pitch=-90)
                ))

            for cav in active_cavs:
                loc = cav.vehicle.get_location()

                # Off-road check.
                # project_to_road=True projects to the nearest driving lane,
                # so it never returns None inside junction geometry.
                # We then check distance — > 4 m from nearest lane = truly off-road.
                # (project_to_road=False returned None at intersections even when
                # the vehicle was correctly traversing them, stopping cars mid-route.)
                _wp = scenario_manager.carla_map.get_waypoint(
                    loc,
                    project_to_road=True,
                    lane_type=carla.LaneType.Driving,
                )
                if _wp is None or _wp.transform.location.distance(loc) > 4.0:
                    log.warning("CAV id=%d off-road at (%.1f, %.1f) — stopped",
                                cav.vehicle.id, loc.x, loc.y)
                    cav.vehicle.apply_control(carla.VehicleControl(throttle=0.0, brake=1.0))
                    finished_ids.add(cav.vehicle.id)
                    continue

                try:
                    cav.update_info()
                    ctrl = cav.run_step()
                    cav.vehicle.apply_control(ctrl)

                    if tick_count % log_interval == 0:
                        v   = cav.vehicle.get_velocity()
                        spd = (v.x**2 + v.y**2 + v.z**2) ** 0.5 * 3.6
                        log.debug(
                            "tick=%d CAV id=%d pos=(%.1f,%.1f,%.1f) speed=%.1f km/h "
                            "throttle=%.2f brake=%.2f steer=%.2f",
                            tick_count, cav.vehicle.id,
                            loc.x, loc.y, loc.z, spd,
                            ctrl.throttle, ctrl.brake, ctrl.steer,
                        )

                except StopIteration:
                    log.info("CAV id=%d reached destination at tick %d",
                             cav.vehicle.id, tick_count)
                    cav.vehicle.apply_control(carla.VehicleControl(throttle=0.0, brake=1.0))
                    finished_ids.add(cav.vehicle.id)

            if single_cav_list and len(finished_ids) >= len(single_cav_list):
                stop_reason = "destination_reached"
                log.info("All %d CAVs finished at tick %d", len(single_cav_list), tick_count)
                break

            tick_count += 1

            if tick_count % log_interval == 0:
                log.info("Progress: tick %d / %d (%.0f%%) | finished %d/%d",
                         tick_count, max_ticks,
                         100 * tick_count / max_ticks,
                         len(finished_ids), len(single_cav_list))
                # RSU coverage metric (for V2X paper evaluation)
                if rsu_list:
                    covered = sum(
                        1 for cav in active_cavs
                        if cav.v2x_manager.rsu_nearby
                    )
                    log.info("RSU coverage: %d/%d active CAVs in communication range",
                             covered, len(active_cavs))

        if stop_reason == "max_ticks" and _stop_event.is_set():
            stop_reason = "stop_event"
        log.info("Simulation loop ended after %d ticks (reason: %s)", tick_count, stop_reason)

    except Exception as e:
        log.exception("Exception in simulation loop at tick %d: %s", tick_count, e)
        raise

    finally:
        log.info("Running evaluation ...")
        try:
            eval_manager.evaluate()
        except Exception as e:
            log.error("Evaluation failed: %s", e, exc_info=True)

        if record:
            scenario_manager.client.stop_recorder()

        log.info("Destroying actors ...")
        for v in single_cav_list + bg_veh_list:
            try:
                v.destroy()
            except Exception as e:
                log.warning("Failed to destroy actor: %s", e)
        for rsu in rsu_list:
            try:
                rsu.destroy()
            except Exception as e:
                log.warning("Failed to destroy RSU: %s", e)
        _destroy_pedestrians(spawned_pedestrians)

        scenario_manager.close()
        log.info("=== run_scenario END | map=%s ticks=%d ===", map_name, tick_count)