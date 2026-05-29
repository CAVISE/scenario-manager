import os
import threading
from dotenv import load_dotenv
from omegaconf import OmegaConf
import carla

os.environ["QT_QPA_PLATFORM"] = "offscreen"

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
from opencda.scenario_testing.evaluations.evaluate_manager import EvaluationManager


def request_stop():
    _stop_event.set()


def run_scenario(scenario_params, params):
    apply_ml  = params["apply_ml"]
    record    = params["record"]
    map_name  = params["map_name"]
    max_ticks = params.get("max_ticks", 1000)

    log.info("=== run_scenario START | map=%s max_ticks=%d carla=%s:%d ===",
             map_name, max_ticks, CARLA_HOST, CARLA_PORT)

    xodr_path = os.path.join(XODR_PATH, f"{map_name}.xodr")
    if not os.path.exists(xodr_path):
        xodr_path = None
    log.debug("xodr_path=%s", xodr_path)

    _stop_event.clear()

    log.info("Connecting to CARLA %s:%d ...", CARLA_HOST, CARLA_PORT)
    client = carla.Client(CARLA_HOST, CARLA_PORT)
    client.set_timeout(10.0)
    log.info("CARLA server version: %s", client.get_server_version())

    cav_world = CavWorld(apply_ml)
    scenario_manager = sim_api.ScenarioManager(
        scenario_params, apply_ml, "0.9.16",
        xodr_path=xodr_path,
        town=map_name if xodr_path is None else None,
        cav_world=cav_world,
    )
    log.info("ScenarioManager ready | map loaded: %s", map_name)

    log.info("Spawning CAVs ...")
    single_cav_list = scenario_manager.create_vehicle_manager(
        application=["single"],
        map_helper=map_api.spawn_helper_2lanefree if xodr_path else None,
    )
    log.info("Spawned %d CAV(s)", len(single_cav_list))
    for i, cav in enumerate(single_cav_list):
        loc  = cav.vehicle.get_location()
        dest = cav.agent.end_waypoint.transform.location \
               if hasattr(cav, "agent") and cav.agent and hasattr(cav.agent, "end_waypoint") \
               else None
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

    rsu_list = []
    scenario_section = OmegaConf.to_container(scenario_params, resolve=True)
    if scenario_section.get("scenario", {}).get("rsu_list"):
        rsu_list = scenario_manager.create_rsu_manager(data_dump=False)
        log.info("Spawned %d RSU(s)", len(rsu_list))

    log.info("Creating background traffic ...")
    traffic_manager, bg_veh_list = scenario_manager.create_traffic_carla()
    log.info("Background vehicles: %d", len(bg_veh_list))

    eval_manager = EvaluationManager(
        scenario_manager.cav_world,
        script_name=map_name,
        current_time=scenario_params["current_time"],
    )

    spectator = scenario_manager.world.get_spectator()

    log.info("Simulation loop starting (max_ticks=%d) ...", max_ticks)
    tick_count = 0
    log_interval = max(1, max_ticks // 20) 

    try:
        stop_reason = "max_ticks"
        finished_ids: set = set()

        while tick_count < max_ticks and not _stop_event.is_set():
            scenario_manager.tick()

            active_cavs = [c for c in single_cav_list if c.vehicle.id not in finished_ids]

            if active_cavs:
                locs = [cav.vehicle.get_location() for cav in active_cavs]
                cx = sum(l.x for l in locs) / len(locs)
                cy = sum(l.y for l in locs) / len(locs)
                spread = max(
                    max(l.x for l in locs) - min(l.x for l in locs),
                    max(l.y for l in locs) - min(l.y for l in locs)
                )
                z = max(80, spread * 1.2)
                spectator.set_transform(carla.Transform(
                    carla.Location(x=cx, y=cy, z=z),
                    carla.Rotation(pitch=-90)
                ))

            for cav in active_cavs:
                loc = cav.vehicle.get_location()
                if not scenario_manager.carla_map.get_waypoint(
                        loc, project_to_road=False,
                        lane_type=carla.LaneType.Driving):
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
                        log.debug("tick=%d CAV id=%d pos=(%.1f,%.1f,%.1f) speed=%.1f km/h "
                                  "throttle=%.2f brake=%.2f steer=%.2f",
                                  tick_count, cav.vehicle.id,
                                  loc.x, loc.y, loc.z, spd,
                                  ctrl.throttle, ctrl.brake, ctrl.steer)

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
                         tick_count, max_ticks, 100 * tick_count / max_ticks,
                         len(finished_ids), len(single_cav_list))

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

        scenario_manager.close()
        log.info("=== run_scenario END | map=%s ticks=%d ===", map_name, tick_count)