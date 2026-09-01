import copy
import math
import logging
log = logging.getLogger(__name__)

MAP_OFFSETS = {
    'Town01':   (212.003,  123.089),
    'Town02':   (97.995,   223.571),
    'Town03':   (18.755,   -22.391),
    'Town04':   (199.921, -169.704),
    'Town05':   (-56.835,    3.766),
    'Town06':   (122.551,  110.646),
    'Town07':   (-74.443,  -47.197),
    'Town10HD': (-8.377,    28.583),
}

_FALLBACK_SPAWN_Z = 0.5
_FALLBACK_DEST_Z  = 0.0

_BFS_STEP_M    = 5.0
_BFS_MAX_STEPS = 300

_NUDGE_DIST_M = 30.0


def _waypoint_z(carla_map, x: float, y: float, hint_z: float = 0.0) -> float | None:
    """Return road-surface z at (x, y), or None if no drivable waypoint nearby."""
    try:
        import carla as _carla
        wp = carla_map.get_waypoint(
            _carla.Location(x=x, y=y, z=hint_z),
            project_to_road=True,
            lane_type=_carla.LaneType.Driving,
        )
        return wp.transform.location.z if wp is not None else None
    except Exception as exc:
        log.warning("_waypoint_z failed at (%.2f, %.2f): %s", x, y, exc)
        return None


def convert_coords(x, y, offset_x, offset_y, carla_map=None, is_spawn=True):
    """
    Convert OpenDRIVE editor coordinates to CARLA world coordinates.

        carla_x =  editor_x + offset_x
        carla_y = -editor_y + offset_y

    z is snapped to road surface when carla_map is provided.
    Spawn points get +0.3 m clearance so the vehicle doesn't clip into ground.
    """
    carla_x = x + offset_x
    carla_y = -y + offset_y
    point_type = "spawn" if is_spawn else "dest"

    log.debug(
        "convert_coords [%s]: editor=(%.4f, %.4f) → carla_xy=(%.4f, %.4f)",
        point_type, x, y, carla_x, carla_y,
    )

    if carla_map is not None:
        road_z = _waypoint_z(carla_map, carla_x, carla_y)
        if road_z is not None:
            carla_z = road_z + 0.3 if is_spawn else road_z
            log.debug(
                "convert_coords [%s]: road snap OK  road_z=%.4f → final_z=%.4f (+0.3 clearance: %s)",
                point_type, road_z, carla_z, is_spawn,
            )
        else:
            log.warning(
                "convert_coords [%s]: NO road waypoint at (%.2f, %.2f) — "
                "vehicle may spawn off-road! Using fallback z=%.1f",
                point_type, carla_x, carla_y,
                _FALLBACK_SPAWN_Z if is_spawn else _FALLBACK_DEST_Z,
            )
            carla_z = _FALLBACK_SPAWN_Z if is_spawn else _FALLBACK_DEST_Z
    else:
        log.debug(
            "convert_coords [%s]: no carla_map available, z=%.1f (fallback)",
            point_type, _FALLBACK_SPAWN_Z if is_spawn else _FALLBACK_DEST_Z,
        )
        carla_z = _FALLBACK_SPAWN_Z if is_spawn else _FALLBACK_DEST_Z

    return [carla_x, carla_y, carla_z]


def _yaw_atan2(sx: float, sy: float, dx: float, dy: float) -> float:
    """Fallback yaw from spawn→dest vector."""
    cdx, cdy = dx - sx, dy - sy
    yaw = math.degrees(math.atan2(cdy, cdx)) if (abs(cdx) > 0.1 or abs(cdy) > 0.1) else 0.0
    log.info("yaw=%.1f deg (atan2 fallback)", yaw)
    return yaw


def _angle_diff(a: float, b: float) -> float:
    """Signed difference (a - b) in [-180, 180]."""
    return (a - b + 180.0) % 360.0 - 180.0


def _wp_route_depth_to_dest(start_wp, dest_wp, max_steps: int = _BFS_MAX_STEPS) -> int | None:
    """
    Return the road-transition depth from start_wp to dest_wp.

    Lane ends form the BFS edges; road and lane IDs form the visited key.
    """
    target_road = dest_wp.road_id
    target_lane = dest_wp.lane_id

    visited: set = set()
    queue = [(start_wp, 0)]
    steps = 0

    while queue and steps < max_steps:
        current, depth = queue.pop(0)
        key = (current.road_id, current.lane_id)   # section_id removed
        if key in visited:
            continue
        visited.add(key)

        if current.road_id == target_road and current.lane_id == target_lane:
            log.debug(
                "BFS: reached target road=%d lane=%d at depth=%d after %d expansions (%d nodes visited)",
                target_road, target_lane, depth, steps, len(visited),
            )
            return depth

        steps += 1

        # Support CARLA versions without next_until_lane_end.
        try:
            end_wps = current.next_until_lane_end(_BFS_STEP_M)
            pivot = end_wps[-1] if end_wps else current
        except Exception:
            pivot = current
        queue.extend((wp, depth + 1) for wp in pivot.next(_BFS_STEP_M))

    log.debug(
        "BFS: exhausted after %d steps (%d nodes visited) — target road=%d lane=%d NOT reached",
        steps, len(visited), target_road, target_lane,
    )
    return None


def _wp_leads_to_dest(start_wp, dest_wp, max_steps: int = _BFS_MAX_STEPS) -> bool:
    """Compatibility wrapper for callers that only need reachability."""
    return _wp_route_depth_to_dest(start_wp, dest_wp, max_steps) is not None


def _compute_yaw(sx: float, sy: float, sz: float,
                 dx: float, dy: float,
                 carla_map=None) -> float:
    """Return the yaw of the spawn lane with the shortest route to dest."""
    if carla_map is None:
        return _yaw_atan2(sx, sy, dx, dy)

    try:
        import carla as _carla

        wp_spawn = carla_map.get_waypoint(
            _carla.Location(x=sx, y=sy, z=sz),
            project_to_road=True,
            lane_type=_carla.LaneType.Driving,
        )
        if wp_spawn is None:
            log.warning("No spawn waypoint at (%.2f, %.2f, %.2f) — atan2 fallback", sx, sy, sz)
            return _yaw_atan2(sx, sy, dx, dy)
        log.debug(
            "yaw: spawn wp snap → (%.2f, %.2f, %.2f) road=%d lane=%d yaw=%.1f°",
            wp_spawn.transform.location.x, wp_spawn.transform.location.y,
            wp_spawn.transform.location.z,
            wp_spawn.road_id, wp_spawn.lane_id, wp_spawn.transform.rotation.yaw,
        )

        wp_dest = carla_map.get_waypoint(
            _carla.Location(x=dx, y=dy, z=sz),
            project_to_road=True,
            lane_type=_carla.LaneType.Driving,
        )
        if wp_dest is None:
            log.warning("No dest waypoint at (%.2f, %.2f) — using spawn lane yaw", dx, dy)
            yaw = wp_spawn.transform.rotation.yaw
            log.info("yaw=%.1f deg (spawn lane, dest wp not found)", yaw)
            return yaw
        log.debug(
            "yaw: dest wp snap → (%.2f, %.2f, %.2f) road=%d lane=%d yaw=%.1f°",
            wp_dest.transform.location.x, wp_dest.transform.location.y,
            wp_dest.transform.location.z,
            wp_dest.road_id, wp_dest.lane_id, wp_dest.transform.rotation.yaw,
        )

        candidates: list[tuple] = []

        def _add(wp, label: str) -> None:
            if wp is not None and wp.lane_type == _carla.LaneType.Driving:
                candidates.append((wp, label))
                flipped = carla_map.get_waypoint(
                    wp.transform.location,
                    project_to_road=True,
                    lane_type=_carla.LaneType.Driving,
                )
                if flipped is not None and flipped.road_id == wp.road_id:
                    candidates.append((flipped, label + "_twin"))

        _add(wp_spawn, "forward")
        _add(wp_spawn.get_left_lane(),  "left_lane")
        _add(wp_spawn.get_right_lane(), "right_lane")

        log.debug(
            "yaw BFS: testing %d candidates for route to road=%d lane=%d: %s",
            len(candidates),
            wp_dest.road_id, wp_dest.lane_id,
            [(lbl, f"road={wp.road_id} lane={wp.lane_id} yaw={wp.transform.rotation.yaw:.1f}°")
             for wp, lbl in candidates],
        )

        to_dest_yaw = math.degrees(math.atan2(dy - sy, dx - sx))
        reachable = []
        seen_candidate_keys = set()
        for wp_cand, label in candidates:
            key = (
                wp_cand.road_id,
                getattr(wp_cand, "section_id", None),
                wp_cand.lane_id,
                round(wp_cand.transform.rotation.yaw, 1),
            )
            if key in seen_candidate_keys:
                continue
            seen_candidate_keys.add(key)

            depth = _wp_route_depth_to_dest(wp_cand, wp_dest)
            if depth is None:
                log.debug("yaw BFS: candidate=%s -> NO route", label)
                continue

            yaw = wp_cand.transform.rotation.yaw
            yaw_error = abs(_angle_diff(yaw, to_dest_yaw))
            reachable.append((depth, yaw_error, label, wp_cand))
            log.debug(
                "yaw BFS: candidate=%s -> route depth=%d yaw_error=%.1f",
                label, depth, yaw_error,
            )

        if reachable:
            reachable.sort(key=lambda item: (item[0], item[1]))
            depth, yaw_error, label, wp_cand = reachable[0]
            yaw = wp_cand.transform.rotation.yaw
            log.info(
                "yaw=%.1f deg (BFS best route, candidate=%s, depth=%d, yaw_error=%.1f)",
                yaw, label, depth, yaw_error,
            )
            return yaw

        yaw = wp_spawn.transform.rotation.yaw
        if abs(_angle_diff(yaw, to_dest_yaw)) > 90.0:
            yaw = (yaw + 180.0 + 180.0) % 360.0 - 180.0
            log.info("yaw=%.1f deg (no BFS route, flipped to face dest)", yaw)
        else:
            log.info("yaw=%.1f deg (no BFS route, spawn lane yaw kept)", yaw)
        return yaw

    except Exception as exc:
        log.warning("_compute_yaw failed: %s — atan2 fallback", exc)
        return _yaw_atan2(sx, sy, dx, dy)


def _nudge_dest_if_same_waypoint(
    sx: float, sy: float, sz: float,
    dx: float, dy: float, dz: float,
    cav_index: int,
    carla_map,
) -> tuple[float, float, float]:
    """
    If spawn and dest snap to the same CARLA waypoint, nudge dest forward
    along the lane by _NUDGE_DIST_M metres so OpenCDA can build a route.

    This prevents the LocalPlanner from seeing an empty route (start == end)
    and holding brake=1.0 for the entire simulation.

    Returns (dx, dy, dz) — possibly updated.
    """
    try:
        import carla as _carla

        wp_s = carla_map.get_waypoint(
            _carla.Location(x=sx, y=sy, z=sz),
            project_to_road=True,
            lane_type=_carla.LaneType.Driving,
        )
        wp_d = carla_map.get_waypoint(
            _carla.Location(x=dx, y=dy, z=dz),
            project_to_road=True,
            lane_type=_carla.LaneType.Driving,
        )

        if wp_s is None or wp_d is None:
            log.warning(
                "CAV%d nudge check: could not get waypoint(s) — "
                "wp_spawn=%s  wp_dest=%s  skipping check",
                cav_index,
                None if wp_s is None else f"road={wp_s.road_id}/lane={wp_s.lane_id}",
                None if wp_d is None else f"road={wp_d.road_id}/lane={wp_d.lane_id}",
            )
            return dx, dy, dz

        log.debug(
            "CAV%d nudge check: spawn wp id=%d (road=%d lane=%d) at (%.2f,%.2f,%.2f)  "
            "dest wp id=%d (road=%d lane=%d) at (%.2f,%.2f,%.2f)",
            cav_index,
            wp_s.id, wp_s.road_id, wp_s.lane_id,
            wp_s.transform.location.x, wp_s.transform.location.y, wp_s.transform.location.z,
            wp_d.id, wp_d.road_id, wp_d.lane_id,
            wp_d.transform.location.x, wp_d.transform.location.y, wp_d.transform.location.z,
        )

        if wp_s.id == wp_d.id:
            log.warning(
                "CAV%d: spawn and dest snap to same waypoint (id=%d, road=%d, lane=%d)"
                " — nudging dest %.0fm forward",
                cav_index, wp_s.id, wp_s.road_id, wp_s.lane_id, _NUDGE_DIST_M,
            )
            nexts = wp_d.next(_NUDGE_DIST_M)
            if nexts:
                loc = nexts[0].transform.location
                dx, dy, dz = loc.x, loc.y, loc.z
                log.info("CAV%d nudged dest to (%.2f, %.2f, %.2f)", cav_index, dx, dy, dz)
            else:
                log.warning(
                    "CAV%d: no waypoint %.0fm ahead of dest — dest unchanged",
                    cav_index, _NUDGE_DIST_M,
                )
        else:
            log.debug(
                "CAV%d nudge check: spawn wp id=%d ≠ dest wp id=%d — no nudge needed",
                cav_index, wp_s.id, wp_d.id,
            )

    except Exception as exc:
        log.warning("CAV%d same-waypoint check failed: %s", cav_index, exc)

    return dx, dy, dz


_GNSS_SPOOF_LEVELS = {
    "low":    {"noise_alt_stddev": 1.0,  "noise_lat_stddev": 3e-5,  "noise_lon_stddev": 3e-5},
    "medium": {"noise_alt_stddev": 5.0,  "noise_lat_stddev": 1e-4,  "noise_lon_stddev": 1e-4},
    "high":   {"noise_alt_stddev": 15.0, "noise_lat_stddev": 5e-4,  "noise_lon_stddev": 5e-4},
}

def _normalize_attack_stages(stages: object) -> list[dict]:
    """Flatten attack stages received from persisted frontend state."""
    if not isinstance(stages, list):
        return []

    flat: list[dict] = []
    for item in stages:
        if isinstance(item, list):
            flat.extend(inner for inner in item if isinstance(inner, dict))
        elif isinstance(item, dict):
            flat.append(item)
    return flat


def _apply_attacks(
    cav_list: list[dict],
    attacks: list[dict],
    fixed_delta_seconds: float = 0.05,
) -> None:
    """Inject GNSS spoofing parameters into CAV localization configs."""
    if not attacks:
        return

    for attack in attacks:
        stages = _normalize_attack_stages(attack.get("stages"))

        atk_type = attack.get("type") or (stages[0].get("type", "") if stages else "")
        if atk_type != "spoofer":
            log.warning("Attack %r: type %r not implemented — skipped", attack.get("name"), atk_type)
            continue

        params = attack.get("params") or (stages[0].get("params") or {} if stages else {})
        mode = str(params.get("mode", "noise")).lower()

        targets = attack.get("targets") or {}
        target_index = targets.get("cav_index")  # 1-based; None → all CAVs

        for idx, cav in enumerate(cav_list, 1):
            if target_index is not None and idx != int(target_index):
                continue

            sensing = cav.setdefault("sensing", {})
            loc = sensing.setdefault("localization", {})

            # Runtime spoofing is part of the active localization pipeline.
            loc["activate"] = True
            loc.setdefault("dt", fixed_delta_seconds)

            if mode == "drift":
                spoofing = {
                    "mode": "drift",
                    "start_time": float(params.get("start_time", 10.0)),
                    "ramp_duration": float(params.get("ramp_duration", 8.0)),
                    "lateral_offset": float(params.get("lateral_offset", 1.8)),
                    "longitudinal_offset": float(
                        params.get("longitudinal_offset", 0.5)
                    ),
                    "drift_rate": float(params.get("drift_rate", 0.08)),
                    "jitter_stddev": float(params.get("jitter_stddev", 0.08)),
                    "max_offset": float(params.get("max_offset", 3.0)),
                }
                for key in (
                    "start_time", "ramp_duration", "drift_rate",
                    "jitter_stddev", "max_offset",
                ):
                    # math.isfinite() catches NaN/Infinity, which `< 0`
                    # alone would miss: NaN compares False to every
                    # comparison, so it would otherwise slip past this
                    # check and reach numpy.random.normal downstream,
                    # which returns NaN silently instead of raising.
                    if not math.isfinite(spoofing[key]) or spoofing[key] < 0:
                        raise ValueError(
                            "GNSS spoofing %s must be a finite, "
                            "non-negative number" % key)
                loc["gnss_spoofing"] = spoofing
                log.info(
                    "ATTACK spoofer -> CAV%d | mode=drift start=%.2fs "
                    "ramp=%.2fs lateral=%.2fm longitudinal=%.2fm "
                    "rate=%.3fm/s max=%.2fm jitter=%.2fm",
                    idx,
                    spoofing["start_time"],
                    spoofing["ramp_duration"],
                    spoofing["lateral_offset"],
                    spoofing["longitudinal_offset"],
                    spoofing["drift_rate"],
                    spoofing["max_offset"],
                    spoofing["jitter_stddev"],
                )
                continue

            if mode == "stealth":
                spoofing = {
                    "mode": "stealth",
                    "start_time": float(params.get("start_time", 10.0)),
                    "ramp_duration": float(params.get("ramp_duration", 8.0)),
                    "lateral_offset": float(params.get("lateral_offset", 1.8)),
                    "longitudinal_offset": float(
                        params.get("longitudinal_offset", 0.5)
                    ),
                    "drift_rate": float(params.get("drift_rate", 0.08)),
                    "jitter_stddev": float(params.get("jitter_stddev", 0.0)),
                    "max_sigma": float(params.get("max_sigma", 2.0)),
                }
                for key in (
                    "start_time", "ramp_duration", "drift_rate",
                    "jitter_stddev", "max_sigma",
                ):
                    if not math.isfinite(spoofing[key]) or spoofing[key] < 0:
                        raise ValueError(
                            "GNSS spoofing %s must be a finite, "
                            "non-negative number" % key)
                loc["gnss_spoofing"] = spoofing
                log.info(
                    "ATTACK spoofer -> CAV%d | mode=stealth start=%.2fs "
                    "ramp=%.2fs lateral=%.2fm longitudinal=%.2fm "
                    "rate=%.3fm/s max_sigma=%.2f jitter=%.2fm",
                    idx,
                    spoofing["start_time"],
                    spoofing["ramp_duration"],
                    spoofing["lateral_offset"],
                    spoofing["longitudinal_offset"],
                    spoofing["drift_rate"],
                    spoofing["max_sigma"],
                    spoofing["jitter_stddev"],
                )
                continue

            if mode != "noise":
                raise ValueError("Unsupported GNSS spoofing mode: %s" % mode)

            intensity = str(params.get("intensity", "medium")).lower()
            noise = _GNSS_SPOOF_LEVELS.get(
                intensity, _GNSS_SPOOF_LEVELS["medium"])
            gnss = loc.setdefault("gnss", {})
            gnss.update(noise)
            log.info(
                "ATTACK spoofer -> CAV%d | mode=noise intensity=%s | "
                "alt_std=%.2f lat_std=%.2e lon_std=%.2e",
                idx, intensity,
                noise["noise_alt_stddev"],
                noise["noise_lat_stddev"],
                noise["noise_lon_stddev"],
            )


def _raw_group_items(json_data: dict, vehicle_type: str) -> list[dict]:
    return [
        item
        for group in json_data.get("scenario", [])
        if group.get("vehicle") == vehicle_type
        for item in group.get("path", [])
    ]


def _source_xyz(value: object, label: str) -> tuple[float, float, float]:
    if not isinstance(value, (list, tuple)) or len(value) < 3:
        raise ValueError(f"{label} must contain at least three coordinates")
    try:
        return float(value[0]), float(value[1]), float(value[2])
    except (TypeError, ValueError) as exc:
        raise ValueError(f"{label} coordinates must be numeric") from exc


def _record_config_override(
    overrides: list[dict],
    path: str,
    source: object,
    effective: object,
    reason: str,
) -> None:
    if source == effective:
        return
    overrides.append({
        "path": path,
        "source": source,
        "effective": effective,
        "reason": reason,
    })


def yaml_to_runtime_scenario(
    source_config: dict,
    json_data: dict,
    carla_map=None,
) -> tuple[dict, list, list[dict]]:
    """Compile the frontend YAML scenario into CARLA world coordinates."""
    if "scenario" not in json_data or not isinstance(json_data["scenario"], list):
        raise ValueError("Invalid payload: 'scenario' must be a list")

    map_name = json_data.get("map", "Town10HD").replace(".xodr", "")
    request_offsets = json_data.get("map_offsets") or {}
    fallback_offsets = MAP_OFFSETS.get(map_name, (0.0, 0.0))
    offset_x = request_offsets.get("x", fallback_offsets[0])
    offset_y = request_offsets.get("y", fallback_offsets[1])
    source_scenario = copy.deepcopy(source_config.get("scenario") or {})
    source_cavs = source_scenario.get("single_cav_list") or []
    source_rsus = source_scenario.get("rsu_list") or []
    raw_cavs = _raw_group_items(json_data, "car")
    raw_rsus = _raw_group_items(json_data, "RSU")
    overrides: list[dict] = []

    if len(source_cavs) != len(raw_cavs) or len(source_rsus) != len(raw_rsus):
        raise ValueError("OpenCDA YAML object counts do not match the scenario payload")

    fixed_delta_seconds = float(
        (source_config.get("world") or {}).get("fixed_delta_seconds", 0.05)
    )
    cav_list = []
    for index, source_cav in enumerate(source_cavs, 1):
        if not isinstance(source_cav, dict):
            raise ValueError(f"scenario.single_cav_list[{index - 1}] must be an object")
        cav = copy.deepcopy(source_cav)
        source_destination = cav["destination"]
        dx_raw, dy_raw, _ = _source_xyz(
            source_destination, f"CAV{index} destination"
        )
        dx, dy, dz = convert_coords(
            dx_raw,
            dy_raw,
            offset_x,
            offset_y,
            carla_map=carla_map,
            is_spawn=False,
        )

        if "spawn_special" not in cav:
            source_spawn = cav["spawn_position"]
            sx_raw, sy_raw, _ = _source_xyz(source_spawn, f"CAV{index} spawn")
            sx, sy, sz = convert_coords(
                sx_raw,
                sy_raw,
                offset_x,
                offset_y,
                carla_map=carla_map,
                is_spawn=True,
            )
            spawn_yaw = _compute_yaw(
                sx, sy, sz, dx, dy, carla_map=carla_map
            )
            if carla_map is not None:
                dx, dy, dz = _nudge_dest_if_same_waypoint(
                    sx, sy, sz, dx, dy, dz, index, carla_map
                )
            effective_spawn = [sx, sy, sz, 0, spawn_yaw, 0]
            _record_config_override(
                overrides,
                f"scenario.single_cav_list[{index - 1}].spawn_position",
                source_spawn,
                effective_spawn,
                "convert editor coordinates and align yaw to the CARLA road graph",
            )
            cav["spawn_position"] = effective_spawn

        effective_destination = [dx, dy, dz]
        _record_config_override(
            overrides,
            f"scenario.single_cav_list[{index - 1}].destination",
            source_destination,
            effective_destination,
            "convert editor coordinates and snap the destination to the CARLA road",
        )
        cav["destination"] = effective_destination
        cav_list.append(cav)

    attacks = source_config.get("attacks") or []
    if attacks:
        _apply_attacks(cav_list, attacks, fixed_delta_seconds)

    rsu_list = []
    for index, source_rsu in enumerate(source_rsus, 1):
        if not isinstance(source_rsu, dict):
            raise ValueError(f"scenario.rsu_list[{index - 1}] must be an object")
        rsu = copy.deepcopy(source_rsu)
        source_spawn = rsu["spawn_position"]
        rx_raw, ry_raw, _ = _source_xyz(source_spawn, f"RSU{index} spawn")
        rx, ry, rz = convert_coords(
            rx_raw,
            ry_raw,
            offset_x,
            offset_y,
            carla_map=carla_map,
            is_spawn=True,
        )
        effective_spawn = [rx, ry, rz, 0, 0, 0]
        _record_config_override(
            overrides,
            f"scenario.rsu_list[{index - 1}].spawn_position",
            source_spawn,
            effective_spawn,
            "convert editor coordinates and snap the RSU to the CARLA road",
        )
        rsu["spawn_position"] = effective_spawn
        rsu_list.append(rsu)

    pedestrian_list = []
    for raw_pedestrian in _raw_group_items(json_data, "pedestrian"):
        px, py, pz = convert_coords(
            raw_pedestrian["x"],
            raw_pedestrian["y"],
            offset_x,
            offset_y,
            carla_map=carla_map,
            is_spawn=True,
        )
        pedestrian_list.append({
            "spawn": [px, py, pz],
            "speed": raw_pedestrian.get("speed", 1.4),
            "cross_factor": raw_pedestrian.get("cross_factor", 0.0),
            "is_invincible": raw_pedestrian.get("is_invincible", True),
            "v2x": {
                "tx_power": raw_pedestrian.get("tx_power", 10),
                "frequency": raw_pedestrian.get("frequency", 5.9e9),
                "protocol": raw_pedestrian.get("protocol", "DSRC"),
                "beacon_interval": raw_pedestrian.get("beacon_interval", 1000),
            },
        })

    source_scenario["name"] = json_data.get("scenario_name", "scenario")
    source_scenario["map"] = map_name
    source_scenario["single_cav_list"] = cav_list
    if source_rsus or "rsu_list" in source_scenario:
        source_scenario["rsu_list"] = rsu_list

    return (
        {"scenario": source_scenario},
        pedestrian_list,
        overrides,
    )
