import os
import threading
from typing import TYPE_CHECKING

import carla
from omegaconf import OmegaConf

from app.config import get_settings
from app.integrations.opencda.runtime import (
    reset_stale_sync_mode as _reset_stale_sync_mode,
    run_with_timeout as _run_with_timeout,
)
from app.integrations.opencda.preflight import (
    check_perception_requires_apply_ml as _check_perception_requires_apply_ml,
    check_scenario_matches_map,
)
from app.integrations.opencda.pedestrians import (
    destroy_pedestrians as _destroy_pedestrians,
    spawn_pedestrians as _spawn_pedestrians,
)
from app.integrations.opencda.telemetry import (
    log_cav_forensic,
    log_rsu_forensic,
)
from app.log_config import add_run_file_handler, get_logger, remove_run_file_handler
from app.integrations.opencda.config import (
    compile_open_cda_config,
    weather_report,
    write_open_cda_artifacts,
)
from opencda.core.common.cav_world import CavWorld
from opencda.scenario_testing.evaluations.evaluate_manager import EvaluationManager
from opencda.scenario_testing.utils import customized_map_api as map_api

if TYPE_CHECKING:
    from opencda.scenario_testing.utils import sim_api

_BASE_DIR = os.path.dirname(os.path.abspath(__file__))
XODR_PATH = os.path.join(_BASE_DIR, "..", "assets", "xodrs")
_stop_event = threading.Event()

log = get_logger(__name__)

STANDARD_MAPS = {
    "Town01",
    "Town02",
    "Town03",
    "Town04",
    "Town05",
    "Town06",
    "Town07",
    "Town10HD",
    "Town11",
    "Town12",
}


def request_stop():
    _stop_event.set()


def _build_scene_dict(scenario_raw: dict, carla_map=None) -> tuple:
    """Compile the canonical frontend YAML for the loaded CARLA map."""
    return compile_open_cda_config(
        scenario_raw,
        get_settings(),
        carla_map=carla_map,
    )


def _check_scenario_matches_map(scene_dict, carla_map) -> None:
    """Compatibility facade for the OpenCDA map-placement preflight check."""
    check_scenario_matches_map(scene_dict, carla_map, logger=log)


def _make_scenario_manager(
    scene_dict, apply_ml: bool, xodr_path, map_name: str, cav_world: CavWorld
) -> "sim_api.ScenarioManager":
    from opencda.scenario_testing.utils import sim_api

    return sim_api.ScenarioManager(
        scene_dict,
        apply_ml,
        "0.9.16",
        xodr_path=xodr_path,
        town=map_name if xodr_path is None else None,
        cav_world=cav_world,
    )


def _run_output_dir(map_name: str, current_time: str) -> str:
    return os.path.abspath(
        os.path.join(
            _BASE_DIR, "..", "evaluation_outputs", f"{map_name}_{current_time}"
        )
    )


def run_scenario(scenario_raw: dict, params: dict):
    settings = get_settings()

    forensic_log_handler = None
    forensic_log_file = "<unknown>"
    scenario_manager = None
    map_name = "<unknown>"
    single_cav_list: list = []
    bg_veh_list: list = []
    rsu_list: list = []
    spawned_pedestrians: list = []
    eval_manager = None
    tick_count = 0
    record = False

    try:
        apply_ml = params["apply_ml"]
        record = params["record"]
        map_name = params["map_name"]
        max_ticks = params.get("max_ticks", 3000)
        current_time = params["current_time"]
        run_output_dir = _run_output_dir(map_name, current_time)
        forensic_log_file = os.path.join(run_output_dir, "forensic.log")
        forensic_log_handler = add_run_file_handler(forensic_log_file)

        log.info(
            "=== run_scenario START | map=%s max_ticks=%d carla=%s:%d ===",
            map_name,
            max_ticks,
            settings.carla_host,
            settings.carla_port,
        )
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

        xodr_path = params.get("xodr_path") or os.path.join(
            XODR_PATH, f"{map_name}.xodr"
        )
        if not os.path.exists(xodr_path) or (
            not params.get("xodr_path") and map_name in STANDARD_MAPS
        ):
            xodr_path = None
        log.debug("xodr_path=%s", xodr_path)

        _stop_event.clear()

        log.info(
            "Connecting to CARLA %s:%d ...", settings.carla_host, settings.carla_port
        )
        client = carla.Client(settings.carla_host, settings.carla_port)
        client.set_timeout(settings.carla_timeout_seconds)
        log.info("CARLA server version: %s", client.get_server_version())

        _reset_stale_sync_mode(client, log)

        def _load_map():
            log.info("Loading map once via client: %s ...", map_name)
            if xodr_path:
                with open(xodr_path) as f:
                    client.generate_opendrive_world(f.read())
            else:
                client.load_world(map_name)
            loaded_map = client.get_world().get_map()
            log.info("carla_map obtained: %s", loaded_map.name)
            return loaded_map

        carla_map = _run_with_timeout(
            _load_map, settings.carla_setup_timeout_seconds, "map load"
        )

        cav_world = CavWorld(apply_ml)
        scene_dict, pedestrian_list, config_overrides = _build_scene_dict(
            scenario_raw,
            carla_map=carla_map,
        )
        _check_scenario_matches_map(scene_dict, carla_map)
        _check_perception_requires_apply_ml(scene_dict, apply_ml)
        OmegaConf.update(scene_dict, "current_time", current_time, merge=False)
        config_overrides.append(
            {
                "path": "current_time",
                "source": None,
                "effective": current_time,
                "reason": "identify artifacts produced by this simulation run",
            }
        )
        write_open_cda_artifacts(
            run_output_dir,
            scenario_raw["opencda_config_yaml"],
            scene_dict,
            config_overrides,
        )
        log.info("OpenCDA configs saved: %s", run_output_dir)

        wr = weather_report(scene_dict)
        if wr["active"]:
            log.info(
                "Weather severity %.2f (raw=%s) -> detection_range x%.2f, "
                "GNSS noise x%.2f for every CAV/RSU",
                wr["severity"],
                wr["raw"],
                wr["effect"]["detection_range_scale"],
                wr["effect"]["gnss_noise_scale"],
            )
        else:
            log.info(
                "Weather (raw=%s) has no perception/localization effect "
                "this run (severity 0.0 — cosmetic only)",
                wr["raw"],
            )

        scenario_manager = _run_with_timeout(
            lambda: _make_scenario_manager(
                scene_dict, apply_ml, xodr_path=None, map_name=None, cav_world=cav_world
            ),
            settings.carla_setup_timeout_seconds,
            "ScenarioManager setup (apply_settings/set_weather)",
        )
        log.info("ScenarioManager ready | map loaded: %s", map_name)

        log.info("Spawning CAVs ...")
        single_cav_list = _run_with_timeout(
            lambda: scenario_manager.create_vehicle_manager(
                application=["single"],
                map_helper=map_api.spawn_helper_2lanefree if xodr_path else None,
            ),
            settings.carla_setup_timeout_seconds,
            "CAV spawning",
        )
        log.info("Spawned %d CAV(s)", len(single_cav_list))
        for i, cav in enumerate(single_cav_list):
            if not cav.vehicle.is_alive:
                log.error(
                    "CAV[%d] id=%d actor is not alive right after spawn "
                    "(destroyed by collision/physics before first tick?)",
                    i,
                    cav.vehicle.id,
                )
                continue
            loc = cav.vehicle.get_location()
            dest = (
                cav.agent.end_waypoint.transform.location
                if hasattr(cav, "agent")
                and cav.agent
                and hasattr(cav.agent, "end_waypoint")
                else None
            )
            log.info(
                "  CAV[%d] id=%d spawn=(%.1f, %.1f, %.1f) dest=%s",
                i,
                cav.vehicle.id,
                loc.x,
                loc.y,
                loc.z,
                f"({dest.x:.1f}, {dest.y:.1f})" if dest else "unknown",
            )

        if single_cav_list:
            locs = [cav.vehicle.get_location() for cav in single_cav_list]
            center_x = sum(location.x for location in locs) / len(locs)
            center_y = sum(location.y for location in locs) / len(locs)
            spectator = scenario_manager.world.get_spectator()
            spectator.set_transform(
                carla.Transform(
                    carla.Location(x=center_x, y=center_y, z=500),
                    carla.Rotation(pitch=-90),
                )
            )
            log.debug("Spectator set to center (%.1f, %.1f, z=500)", center_x, center_y)

        scene_container = OmegaConf.to_container(scene_dict, resolve=True)
        if scene_container.get("scenario", {}).get("rsu_list"):
            rsu_list = scenario_manager.create_rsu_manager(data_dump=False)
            log.info("Spawned %d RSU(s)", len(rsu_list))

        log.info("Creating background traffic ...")
        traffic_manager, bg_veh_list = scenario_manager.create_traffic_carla()
        log.info("Background vehicles: %d", len(bg_veh_list))

        spawned_pedestrians = _spawn_pedestrians(
            scenario_manager.world, pedestrian_list, cav_world
        )

        eval_manager = EvaluationManager(
            scenario_manager.cav_world,
            script_name=map_name,
            current_time=current_time,
            fixed_delta_seconds=float(scene_dict.world.fixed_delta_seconds),
            weather_report=wr,
        )

        spectator = scenario_manager.world.get_spectator()

        log.info("Simulation loop starting (max_ticks=%d) ...", max_ticks)
        log_interval = max(1, max_ticks // 20)

        stop_reason = "max_ticks"
        finished_ids: set = set()

        while tick_count < max_ticks and not _stop_event.is_set():
            scenario_manager.tick()

            active_cavs = [
                c for c in single_cav_list if c.vehicle.id not in finished_ids
            ]

            for rsu in rsu_list:
                try:
                    rsu.update_info()
                    log_rsu_forensic(tick_count, rsu, logger=log)
                except Exception as _rsu_err:
                    log.warning("RSU id=%d update_info failed: %s", rsu.rid, _rsu_err)

            for pedestrian in spawned_pedestrians:
                try:
                    pedestrian.update_info()
                except Exception as _ped_err:
                    log.warning(
                        "Pedestrian id=%d update_info failed: %s",
                        pedestrian.pid,
                        _ped_err,
                    )

            if active_cavs:
                locs = [cav.vehicle.get_location() for cav in active_cavs]
                cx = sum(location.x for location in locs) / len(locs)
                cy = sum(location.y for location in locs) / len(locs)
                spread = max(
                    max(location.x for location in locs)
                    - min(location.x for location in locs),
                    max(location.y for location in locs)
                    - min(location.y for location in locs),
                )
                z = max(80, spread * 1.2)
                spectator.set_transform(
                    carla.Transform(
                        carla.Location(x=cx, y=cy, z=z), carla.Rotation(pitch=-90)
                    )
                )

            for cav in active_cavs:
                loc = cav.vehicle.get_location()

                _wp = scenario_manager.carla_map.get_waypoint(
                    loc,
                    project_to_road=True,
                    lane_type=carla.LaneType.Driving,
                )
                road_distance = (
                    _wp.transform.location.distance(loc) if _wp is not None else None
                )
                if _wp is None or road_distance > 4.0:
                    log.warning(
                        "CAV id=%d off-road at (%.1f, %.1f) — stopped",
                        cav.vehicle.id,
                        loc.x,
                        loc.y,
                    )
                    log.warning(
                        "CAV id=%d off-road road_distance=%s",
                        cav.vehicle.id,
                        f"{road_distance:.2f}" if road_distance is not None else "None",
                    )
                    stop_control = carla.VehicleControl(throttle=0.0, brake=1.0)
                    cav.vehicle.apply_control(stop_control)
                    log_cav_forensic(
                        tick_count,
                        cav,
                        stop_control,
                        note="runner_offroad_stop",
                        logger=log,
                    )
                    finished_ids.add(cav.vehicle.id)
                    continue

                try:
                    cav.update_info()
                    ctrl = cav.run_step()
                    cav.vehicle.apply_control(ctrl)
                    log_cav_forensic(
                        tick_count,
                        cav,
                        ctrl,
                        note="post_control",
                        logger=log,
                    )

                    if tick_count % log_interval == 0:
                        v = cav.vehicle.get_velocity()
                        spd = (v.x**2 + v.y**2 + v.z**2) ** 0.5 * 3.6
                        log.debug(
                            "tick=%d CAV id=%d pos=(%.1f,%.1f,%.1f) speed=%.1f km/h "
                            "throttle=%.2f brake=%.2f steer=%.2f",
                            tick_count,
                            cav.vehicle.id,
                            loc.x,
                            loc.y,
                            loc.z,
                            spd,
                            ctrl.throttle,
                            ctrl.brake,
                            ctrl.steer,
                        )

                except StopIteration:
                    log.info(
                        "CAV id=%d reached destination at tick %d",
                        cav.vehicle.id,
                        tick_count,
                    )
                    cav.vehicle.apply_control(
                        carla.VehicleControl(throttle=0.0, brake=1.0)
                    )
                    finished_ids.add(cav.vehicle.id)

                except Exception as _cav_err:
                    log.warning(
                        "CAV id=%d update/control step failed at tick %d: %s "
                        "— stopping this CAV, run continues",
                        cav.vehicle.id,
                        tick_count,
                        _cav_err,
                    )
                    try:
                        cav.vehicle.apply_control(
                            carla.VehicleControl(throttle=0.0, brake=1.0)
                        )
                    except Exception as _stop_err:
                        log.warning(
                            "CAV id=%d could not be safe-stopped after failure: %s",
                            cav.vehicle.id,
                            _stop_err,
                        )
                    finished_ids.add(cav.vehicle.id)

            if single_cav_list and len(finished_ids) >= len(single_cav_list):
                stop_reason = "destination_reached"
                log.info(
                    "All %d CAVs finished at tick %d", len(single_cav_list), tick_count
                )
                break

            tick_count += 1

            if tick_count % log_interval == 0:
                progress = params.get("on_progress")
                if callable(progress):
                    progress(tick_count, max_ticks)
                log.info(
                    "Progress: tick %d / %d (%.0f%%) | finished %d/%d",
                    tick_count,
                    max_ticks,
                    100 * tick_count / max_ticks,
                    len(finished_ids),
                    len(single_cav_list),
                )
                if rsu_list:
                    covered = sum(
                        1 for cav in active_cavs if cav.v2x_manager.rsu_nearby
                    )
                    log.info(
                        "RSU coverage: %d/%d active CAVs in communication range",
                        covered,
                        len(active_cavs),
                    )

        if stop_reason == "max_ticks" and _stop_event.is_set():
            stop_reason = "stop_event"
        log.info(
            "Simulation loop ended after %d ticks (reason: %s)", tick_count, stop_reason
        )

    except BaseException as e:
        log.exception("Exception in simulation loop at tick %d: %s", tick_count, e)
        raise

    finally:
        log.info("Running evaluation ...")
        if eval_manager is not None:
            try:
                eval_manager.evaluate()
            except Exception as e:
                log.error("Evaluation failed: %s", e, exc_info=True)
        else:
            log.warning(
                "Skipping evaluation: run_scenario failed before "
                "EvaluationManager was created"
            )

        if record and scenario_manager is not None:
            try:
                scenario_manager.client.stop_recorder()
            except Exception as e:
                log.warning("Failed to stop recorder: %s", e)

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

        if scenario_manager is not None:
            try:
                scenario_manager.close()
            except Exception as e:
                log.warning("Failed to close ScenarioManager: %s", e)

        log.info("=== run_scenario END | map=%s ticks=%d ===", map_name, tick_count)
        log.info("Per-run forensic log saved at: %s", forensic_log_file)
        remove_run_file_handler(forensic_log_handler)

    return {
        "tick": tick_count,
        "max_ticks": max_ticks,
        "partial": stop_reason == "stop_event",
    }
