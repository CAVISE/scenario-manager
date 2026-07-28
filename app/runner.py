import os
import random
import threading

import carla
from omegaconf import OmegaConf

from app.config import get_settings
from app.log_config import add_run_file_handler, get_logger, remove_run_file_handler
from app.opencda_config import compile_open_cda_config, write_open_cda_artifacts
from opencda.core.common.cav_world import CavWorld
from opencda.scenario_testing.evaluations.evaluate_manager import EvaluationManager
from opencda.scenario_testing.utils import customized_map_api as map_api
from opencda.scenario_testing.utils import sim_api

_BASE_DIR = os.path.dirname(os.path.abspath(__file__))
XODR_PATH = os.path.join(_BASE_DIR, "..", "assets", "xodrs")
_stop_event = threading.Event()

log = get_logger(__name__)

<<<<<<< HEAD
from opencda.core.common.cav_world import CavWorld
from opencda.scenario_testing.utils import customized_map_api as map_api
from opencda.scenario_testing.utils import sim_api
from opencda.scenario_testing.utils.yaml_utils import add_current_time
from opencda.scenario_testing.evaluations.evaluate_manager import EvaluationManager
from app.config import get_settings
from app import utils

=======
>>>>>>> c8ef1d03840f60d256ebb625220cd565f0cd09ad
STANDARD_MAPS = {
    'Town01', 'Town02', 'Town03', 'Town04', 'Town05',
    'Town06', 'Town07', 'Town10HD', 'Town11', 'Town12',
}


def request_stop():
    _stop_event.set()


<<<<<<< HEAD
def _build_scene_dict(scenario_raw: dict, carla_map=None) -> OmegaConf:
    """
    Convert the raw frontend payload to a fully-merged OmegaConf scene dict.

    When carla_map is provided, spawn yaw values are taken from road waypoints
    (accurate).  On the first call carla_map is None and yaw falls back to the
    atan2 heuristic — that dict is used only to boot ScenarioManager so we can
    obtain the real carla.Map; it is then discarded.
    """
    settings = get_settings()
    base_dict = OmegaConf.load(settings.cfg_dir / "base.yaml")
    scenario_section = utils.json_to_single_cav_list(scenario_raw, carla_map=carla_map)
    scene_dict = OmegaConf.merge(base_dict, OmegaConf.create(scenario_section))
    scene_dict = add_current_time(scene_dict)
    return scene_dict
=======
def _build_scene_dict(scenario_raw: dict, carla_map=None) -> tuple:
    """Compile the canonical frontend YAML for the loaded CARLA map."""
    return compile_open_cda_config(
        scenario_raw,
        get_settings(),
        carla_map=carla_map,
    )
>>>>>>> c8ef1d03840f60d256ebb625220cd565f0cd09ad


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


<<<<<<< HEAD
def run_scenario(scenario_raw: dict, params: dict):
=======
def _spawn_pedestrians(world, pedestrian_list: list) -> list:
    """Spawn walkers and return actor/controller pairs for cleanup."""
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


def _run_output_dir(map_name: str, current_time: str) -> str:
    return os.path.abspath(os.path.join(
        _BASE_DIR, "..", "evaluation_outputs", f"{map_name}_{current_time}"))


def _fmt_loc(loc) -> str:
    if loc is None:
        return "None"
    return f"({loc.x:.2f},{loc.y:.2f},{loc.z:.2f})"


def _speed_kmh(vehicle) -> float:
    v = vehicle.get_velocity()
    return (v.x**2 + v.y**2 + v.z**2) ** 0.5 * 3.6


def _latest_safety_status(cav):
    status_queue = getattr(cav.safety_manager, "status_queue", None)
    if not status_queue:
        return None, {}
    tick, status = status_queue[-1]
    return tick, status


def _destination_distance(cav) -> float | None:
    try:
        dest = cav.agent.end_waypoint.transform.location
        return cav.vehicle.get_location().distance(dest)
    except Exception:
        return None


def _log_cav_forensic(tick_count: int, cav, control=None, note: str = "") -> None:
    gt_transform = cav.vehicle.get_transform()
    gt_loc = gt_transform.location
    estimated_transform = cav.localizer.get_estimated_ego_pos()
    estimated_loc = (
        estimated_transform.location if estimated_transform is not None
        else None
    )
    navigation_pose = getattr(cav, "navigation_pose", None)
    navigation_loc = (
        navigation_pose.location if navigation_pose is not None else None
    )
    transmitted_pose = getattr(cav, "transmitted_pose", None)
    transmitted_loc = (
        transmitted_pose.location if transmitted_pose is not None else None
    )

    if estimated_loc is not None:
        dx = estimated_loc.x - gt_loc.x
        dy = estimated_loc.y - gt_loc.y
        dz = estimated_loc.z - gt_loc.z
        loc_err = (dx**2 + dy**2 + dz**2) ** 0.5
        loc_error_text = f"dx={dx:.2f} dy={dy:.2f} dz={dz:.2f} norm={loc_err:.2f}"
    else:
        loc_error_text = "unknown"

    safety_tick, status = _latest_safety_status(cav)
    hazards = [
        key for key in ("collision", "offroad", "stuck", "ran_light")
        if status.get(key)
    ]
    hazard_text = ",".join(hazards) if hazards else "none"
    ctrl_text = (
        f"thr={control.throttle:.3f} brake={control.brake:.3f} "
        f"steer={control.steer:.3f}"
        if control is not None else "None"
    )
    dest_dist = _destination_distance(cav)
    rs = cav.rsu_merge_stats

    log.debug(
        "[forensic] tick=%d cav=%d note=%s gt_pos=%s gt_yaw=%.2f "
        "estimated_pos=%s navigation_pos=%s transmitted_pos=%s "
        "loc_error=(%s) gt_speed=%.2f loc_speed=%.2f "
        "control=(%s) dest_dist=%s safety_tick=%s hazards=%s "
        "rsu_nearby=%d rsu_ticks=%d/%d rsu_merged_total=%d",
        tick_count,
        cav.vehicle.id,
        note or "-",
        _fmt_loc(gt_loc),
        gt_transform.rotation.yaw,
        _fmt_loc(estimated_loc),
        _fmt_loc(navigation_loc),
        _fmt_loc(transmitted_loc),
        loc_error_text,
        _speed_kmh(cav.vehicle),
        cav.localizer.get_ego_spd(),
        ctrl_text,
        f"{dest_dist:.2f}" if dest_dist is not None else "unknown",
        safety_tick,
        hazard_text,
        len(cav.v2x_manager.rsu_nearby),
        rs["ticks_rsu_in_range"],
        rs["ticks_total"],
        rs["objects_merged_total"],
    )


def _log_rsu_forensic(tick_count: int, rsu) -> None:
    objects = rsu.get_detected_objects()
    counts = {key: len(value) for key, value in objects.items()
              if isinstance(value, list)}
    ego_pos = rsu.localizer.get_ego_pos()
    loc = ego_pos.location if ego_pos is not None else None
    log.debug(
        "[forensic] tick=%d rsu=%s pos=%s range=%.2f detected=%s",
        tick_count,
        rsu.rid,
        _fmt_loc(loc),
        rsu.communication_range,
        counts,
    )


def run_scenario(scenario_raw: dict, params: dict):
    settings = get_settings()
>>>>>>> c8ef1d03840f60d256ebb625220cd565f0cd09ad
    apply_ml  = params["apply_ml"]
    record    = params["record"]
    map_name  = params["map_name"]
    max_ticks = params.get("max_ticks", 3000)
    current_time = params["current_time"]
<<<<<<< HEAD
=======
    run_output_dir = _run_output_dir(map_name, current_time)
    forensic_log_file = os.path.join(run_output_dir, "forensic.log")
    forensic_log_handler = add_run_file_handler(forensic_log_file)
>>>>>>> c8ef1d03840f60d256ebb625220cd565f0cd09ad

    log.info("=== run_scenario START | map=%s max_ticks=%d carla=%s:%d ===",
             map_name, max_ticks, settings.carla_host, settings.carla_port)
    log.info("Per-run forensic log: %s", forensic_log_file)
    log.debug(
        "[forensic] run_config params=%s scenario_items=%d attacks=%s "
        "xodr_present=%s xodr_length=%d",
        params,
        len(scenario_raw.get("scenario", [])),
        scenario_raw.get("attacks", []),
        bool(scenario_raw.get("xodr")),
        len(scenario_raw.get("xodr") or ""),
    )

    xodr_path = os.path.join(XODR_PATH, f"{map_name}.xodr")
    if not os.path.exists(xodr_path) or map_name in STANDARD_MAPS:
        xodr_path = None
    log.debug("xodr_path=%s", xodr_path)

    _stop_event.clear()

    log.info("Connecting to CARLA %s:%d ...", settings.carla_host, settings.carla_port)
    client = carla.Client(settings.carla_host, settings.carla_port)
    client.set_timeout(settings.carla_timeout_seconds)
    log.info("CARLA server version: %s", client.get_server_version())

<<<<<<< HEAD
    # ── Phase 1 ──────────────────────────────────────────────────────────────
    # Build scene_dict with atan2 yaw (carla_map not yet available).
    # Create a ScenarioManager solely to load the map and obtain carla.Map.
    # We close it immediately — the world stays loaded in CARLA.
    log.info("Phase 1: loading map to obtain carla_map ...")
    cav_world_phase1 = CavWorld(apply_ml)
    scene_dict_phase1 = _build_scene_dict(scenario_raw, carla_map=None)

    sm_phase1 = _make_scenario_manager(
        scene_dict_phase1, apply_ml, xodr_path, map_name, cav_world_phase1
    )
    carla_map = sm_phase1.carla_map
    log.info("carla_map obtained: %s", carla_map.name)

    # Close phase-1 manager — restores world settings but leaves the map loaded.
    sm_phase1.close()

    # ── Phase 2 ──────────────────────────────────────────────────────────────
    # Rebuild scene_dict with accurate road-waypoint yaw values.
    log.info("Phase 2: rebuilding scene_dict with road yaw ...")
    cav_world = CavWorld(apply_ml)
    scene_dict = _build_scene_dict(scenario_raw, carla_map=carla_map)

    # Override current_time to match the run_id that api.py already computed.
    scene_dict_container = OmegaConf.to_container(scene_dict, resolve=True)
    scene_dict_container["current_time"] = current_time
    scene_dict = OmegaConf.create(scene_dict_container)

    scenario_manager = _make_scenario_manager(
        scene_dict, apply_ml, xodr_path, map_name, cav_world
=======
    log.info("Loading map once via client: %s ...", map_name)
    if xodr_path:
        with open(xodr_path) as f:
            client.generate_opendrive_world(f.read())
    else:
        client.load_world(map_name)

    carla_map = client.get_world().get_map()
    log.info("carla_map obtained: %s", carla_map.name)

    cav_world = CavWorld(apply_ml)
    scene_dict, pedestrian_list, config_overrides = _build_scene_dict(
        scenario_raw,
        carla_map=carla_map,
    )

    # Preserve unresolved interpolations in the original DictConfig.
    OmegaConf.update(scene_dict, "current_time", current_time, merge=False)
    config_overrides.append({
        "path": "current_time",
        "source": None,
        "effective": current_time,
        "reason": "identify artifacts produced by this simulation run",
    })
    write_open_cda_artifacts(
        run_output_dir,
        scenario_raw["opencda_config_yaml"],
        scene_dict,
        config_overrides,
    )
    log.info("OpenCDA configs saved: %s", run_output_dir)

    scenario_manager = _make_scenario_manager(
        scene_dict, apply_ml, xodr_path=None, map_name=None, cav_world=cav_world
>>>>>>> c8ef1d03840f60d256ebb625220cd565f0cd09ad
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

    # Spectator — центр между всеми CAV'ами
    if single_cav_list:
        locs     = [cav.vehicle.get_location() for cav in single_cav_list]
        center_x = sum(location.x for location in locs) / len(locs)
        center_y = sum(location.y for location in locs) / len(locs)
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

<<<<<<< HEAD
    # ── Evaluation manager ────────────────────────────────────────────────────
=======
    spawned_pedestrians = _spawn_pedestrians(scenario_manager.world, pedestrian_list)

>>>>>>> c8ef1d03840f60d256ebb625220cd565f0cd09ad
    eval_manager = EvaluationManager(
        scenario_manager.cav_world,
        script_name=map_name,
        current_time=current_time,
<<<<<<< HEAD
=======
        fixed_delta_seconds=float(scene_dict.world.fixed_delta_seconds),
>>>>>>> c8ef1d03840f60d256ebb625220cd565f0cd09ad
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

<<<<<<< HEAD
            # Follow camera
            if active_cavs:
                locs   = [cav.vehicle.get_location() for cav in active_cavs]
                cx     = sum(l.x for l in locs) / len(locs)
                cy     = sum(l.y for l in locs) / len(locs)
                spread = max(
                    max(l.x for l in locs) - min(l.x for l in locs),
                    max(l.y for l in locs) - min(l.y for l in locs),
=======
            # CAV updates consume RSU detections from the current tick.
            for rsu in rsu_list:
                try:
                    rsu.update_info()
                    _log_rsu_forensic(tick_count, rsu)
                except Exception as _rsu_err:
                    log.warning("RSU id=%d update_info failed: %s", rsu.rid, _rsu_err)

            if active_cavs:
                locs   = [cav.vehicle.get_location() for cav in active_cavs]
                cx     = sum(location.x for location in locs) / len(locs)
                cy     = sum(location.y for location in locs) / len(locs)
                spread = max(
                    max(location.x for location in locs)
                    - min(location.x for location in locs),
                    max(location.y for location in locs)
                    - min(location.y for location in locs),
>>>>>>> c8ef1d03840f60d256ebb625220cd565f0cd09ad
                )
                z = max(80, spread * 1.2)
                spectator.set_transform(carla.Transform(
                    carla.Location(x=cx, y=cy, z=z),
                    carla.Rotation(pitch=-90)
                ))

            for cav in active_cavs:
                loc = cav.vehicle.get_location()

<<<<<<< HEAD
                # Off-road check
                if not scenario_manager.carla_map.get_waypoint(
                        loc,
                        project_to_road=False,
                        lane_type=carla.LaneType.Driving):
=======
                # Projection handles junction geometry; distance rejects off-road poses.
                _wp = scenario_manager.carla_map.get_waypoint(
                    loc,
                    project_to_road=True,
                    lane_type=carla.LaneType.Driving,
                )
                road_distance = (_wp.transform.location.distance(loc)
                                 if _wp is not None else None)
                if _wp is None or road_distance > 4.0:
>>>>>>> c8ef1d03840f60d256ebb625220cd565f0cd09ad
                    log.warning("CAV id=%d off-road at (%.1f, %.1f) — stopped",
                                cav.vehicle.id, loc.x, loc.y)
                    log.warning("CAV id=%d off-road road_distance=%s",
                                cav.vehicle.id,
                                f"{road_distance:.2f}" if road_distance is not None else "None")
                    stop_control = carla.VehicleControl(throttle=0.0, brake=1.0)
                    cav.vehicle.apply_control(stop_control)
                    _log_cav_forensic(
                        tick_count,
                        cav,
                        stop_control,
                        note="runner_offroad_stop",
                    )
                    finished_ids.add(cav.vehicle.id)
                    continue

                try:
                    cav.update_info()
                    ctrl = cav.run_step()
                    cav.vehicle.apply_control(ctrl)
                    _log_cav_forensic(tick_count, cav, ctrl, note="post_control")

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

        try:
            scenario_manager.close()
        except Exception as e:
            log.warning("Failed to close ScenarioManager: %s", e)
        log.info("=== run_scenario END | map=%s ticks=%d ===", map_name, tick_count)
        log.info("Per-run forensic log saved at: %s", forensic_log_file)
        remove_run_file_handler(forensic_log_handler)
