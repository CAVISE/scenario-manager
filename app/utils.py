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

# Fallback z when carla_map is not yet available.
_FALLBACK_SPAWN_Z = 0.5
_FALLBACK_DEST_Z  = 0.0

# BFS params
_BFS_STEP_M    = 5.0   # metres between waypoints in BFS
_BFS_MAX_STEPS = 300   # ~1.5 km max route search depth

# Nudge applied when spawn and dest snap to the same waypoint
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


# ---------------------------------------------------------------------------
# Yaw helpers
# ---------------------------------------------------------------------------

def _yaw_atan2(sx: float, sy: float, dx: float, dy: float) -> float:
    """Fallback yaw from spawn→dest vector."""
    cdx, cdy = dx - sx, dy - sy
    yaw = math.degrees(math.atan2(cdy, cdx)) if (abs(cdx) > 0.1 or abs(cdy) > 0.1) else 0.0
    log.info("yaw=%.1f deg (atan2 fallback)", yaw)
    return yaw


def _angle_diff(a: float, b: float) -> float:
    """Signed difference (a - b) in [-180, 180]."""
    return (a - b + 180.0) % 360.0 - 180.0


def _wp_leads_to_dest(start_wp, dest_wp, max_steps: int = _BFS_MAX_STEPS) -> bool:
    """
    Road-level BFS: returns True if start_wp can reach dest_wp's road+lane
    within max_steps road transitions.  Uses (road_id, lane_id) as visited
    key (section_id omitted — most CARLA roads have section_id=0 for all
    their waypoints, so including it would prevent the BFS from ever leaving
    the starting road).

    At each step we advance to the END of the current lane via
    next_until_lane_end(), then call next() on the last waypoint to obtain
    waypoints on the *connecting* roads.  This ensures every BFS step
    corresponds to a genuine road transition rather than a 5 m shuffle
    within the same road segment.
    """
    target_road = dest_wp.road_id
    target_lane = dest_wp.lane_id

    visited: set = set()
    queue = [start_wp]
    steps = 0

    while queue and steps < max_steps:
        current = queue.pop(0)
        key = (current.road_id, current.lane_id)   # section_id removed
        if key in visited:
            continue
        visited.add(key)

        if current.road_id == target_road and current.lane_id == target_lane:
            log.debug(
                "BFS: reached target road=%d lane=%d in %d steps (%d nodes visited)",
                target_road, target_lane, steps, len(visited),
            )
            return True

        steps += 1

        # Advance to the end of the current lane, then collect the connecting
        # roads.  Falling back to a plain next() call keeps things working if
        # next_until_lane_end is unavailable (older CARLA builds).
        try:
            end_wps = current.next_until_lane_end(_BFS_STEP_M)
            pivot = end_wps[-1] if end_wps else current
        except Exception:
            pivot = current
        queue.extend(pivot.next(_BFS_STEP_M))

    log.debug(
        "BFS: exhausted after %d steps (%d nodes visited) — target road=%d lane=%d NOT reached",
        steps, len(visited), target_road, target_lane,
    )
    return False


def _compute_yaw(sx: float, sy: float, sz: float,
                 dx: float, dy: float,
                 carla_map=None) -> float:
    """
    Return the spawn yaw that puts the vehicle on the lane leading toward
    the destination.

    Algorithm:
      1. Get waypoint at spawn → wp_spawn (forward lane direction).
      2. Get waypoint at destination → wp_dest.
      3. Collect candidates: wp_spawn itself, its left neighbour, right
         neighbour.  For each, also check the 180°-flipped twin (same
         physical point, opposite direction) so we cover both driving
         directions on any road.
      4. BFS from each candidate to wp_dest.  Return the yaw of the first
         candidate that reaches dest.
      5. If no candidate reaches dest fall back to: flip wp_spawn yaw if the
         atan2 vector disagrees by >90°, otherwise keep wp_spawn yaw.
      6. Ultimate fallback: atan2(spawn→dest).
    """
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

        # Build candidate waypoints to test
        # Each entry: (waypoint, label)
        candidates: list[tuple] = []

        def _add(wp, label: str) -> None:
            if wp is not None and wp.lane_type == _carla.LaneType.Driving:
                candidates.append((wp, label))
                # Also test the 180° flipped direction at same location
                flipped = carla_map.get_waypoint(
                    wp.transform.location,
                    project_to_road=True,
                    lane_type=_carla.LaneType.Driving,
                )
                # A "flipped" wp on a two-way road sits in the opposite lane
                # after get_waypoint snaps — but on one-way roads it's the
                # same wp. We always add it; BFS will discard if it loops.
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

        for wp_cand, label in candidates:
            if _wp_leads_to_dest(wp_cand, wp_dest):
                yaw = wp_cand.transform.rotation.yaw
                log.info("yaw=%.1f deg (BFS route found, candidate=%s)", yaw, label)
                return yaw
            else:
                log.debug("yaw BFS: candidate=%s → NO route", label)

        # BFS found no route — best-effort: compare wp_spawn yaw vs atan2
        yaw = wp_spawn.transform.rotation.yaw
        to_dest_yaw = math.degrees(math.atan2(dy - sy, dx - sx))
        if abs(_angle_diff(yaw, to_dest_yaw)) > 90.0:
            # Flip 180° and normalise into [-180, 180]
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


# ---------------------------------------------------------------------------
# Attack configuration
# ---------------------------------------------------------------------------

# GNSS noise levels per attack intensity
_GNSS_SPOOF_LEVELS = {
    "low":    {"noise_alt_stddev": 1.0,  "noise_lat_stddev": 3e-5,  "noise_lon_stddev": 3e-5},
    "medium": {"noise_alt_stddev": 5.0,  "noise_lat_stddev": 1e-4,  "noise_lon_stddev": 1e-4},
    "high":   {"noise_alt_stddev": 15.0, "noise_lat_stddev": 5e-4,  "noise_lon_stddev": 5e-4},
}

# Baseline (non-attack) GNSS noise — mirrors assets/opencda/base.yaml's
# sensing.localization.gnss block. base.yaml ships localization.activate:
# false by default, which makes LocalizationManager.localize() bypass the
# GNSS sensor entirely (vehicle.get_transform() straight to _ego_pos) —
# fine for OpenCDA's stock use case, but it means an attack-free run and
# an attack run aren't otherwise comparable: one has a real sensor+KF
# stack in the loop and the other doesn't. _ensure_localization_baseline
# turns the stack on for every CAV unconditionally, so "no attack" means
# "ordinary GNSS noise" rather than "no GNSS sensor at all", and the only
# difference an active attack introduces is the amplified stddev below.
_GNSS_BASELINE = {
    "noise_alt_stddev": 0.001,
    "noise_lat_stddev": 1.0e-6,
    "noise_lon_stddev": 1.0e-6,
    "heading_direction_stddev": 0.1,
    "speed_stddev": 0.2,
}


def _ensure_localization_baseline(cav_list: list[dict]) -> None:
    """
    Force sensing.localization.activate=True with stock (non-attack) GNSS
    noise on every CAV, before any attack is applied.

    Must run before _apply_attacks() so that attacked CAVs simply have
    their gnss stddevs overwritten by the higher attack-intensity values
    (see _apply_attacks) on top of an already-active localization stack,
    rather than _apply_attacks being the sole place activate gets set.
    """
    for cav in cav_list:
        sensing = cav.setdefault("sensing", {})
        loc = sensing.setdefault("localization", {})
        gnss = loc.setdefault("gnss", {})

        loc["activate"] = True
        loc["dt"] = 0.05

        for key, val in _GNSS_BASELINE.items():
            gnss[key] = val


def _normalize_attack_stages(stages: object) -> list[dict]:
    """
    Flatten a `stages` value into a flat list[dict].

    The frontend's OpenCDAAttackStage[] type is meant to be flat, but stale
    data persisted in localStorage before the frontend's own normalization
    guard (normalizeAttackStages in AttackConfigModal.tsx) was added can
    still arrive nested one level, e.g. [[{...}]] instead of [{...}].
    Mirrors the frontend flattening logic so the backend never trusts the
    wire shape blindly.
    """
    if not isinstance(stages, list):
        return []

    flat: list[dict] = []
    for item in stages:
        if isinstance(item, list):
            flat.extend(inner for inner in item if isinstance(inner, dict))
        elif isinstance(item, dict):
            flat.append(item)
    return flat


def _apply_attacks(cav_list: list[dict], attacks: list[dict]) -> None:
    """
    Inject attack parameters into CAV sensing.localization blocks.

    Supported attack types:
      spoofer — amplifies GNSS noise to simulate position falsification.

    Attack schema (matches OpenCDAAttackConfig on the frontend):
      {
        "name": "gnss_spoof",
        "type": "spoofer",
        "targets": {"cav_index": 1},   # 1-based; omit or null → all CAVs
        "stages": [{"type": "spoofer", "params": {"intensity": "high"}}]
      }

    `stages` is defensively normalized via _normalize_attack_stages since
    stale frontend state can still deliver a nested shape (see docstring
    there) — this guards against any future regression on either side.
    """
    if not attacks:
        return

    for attack in attacks:
        stages = _normalize_attack_stages(attack.get("stages"))

        # Resolve type: top-level or first stage
        atk_type = attack.get("type") or (stages[0].get("type", "") if stages else "")
        if atk_type != "spoofer":
            log.warning("Attack %r: type %r not implemented — skipped", attack.get("name"), atk_type)
            continue

        # Resolve params: top-level or first stage
        params = attack.get("params") or (stages[0].get("params") or {} if stages else {})
        intensity = str(params.get("intensity", "medium")).lower()
        noise = _GNSS_SPOOF_LEVELS.get(intensity, _GNSS_SPOOF_LEVELS["medium"])

        # Resolve targets
        targets = attack.get("targets") or {}
        target_index = targets.get("cav_index")  # 1-based; None → all CAVs

        for idx, cav in enumerate(cav_list, 1):
            if target_index is not None and idx != int(target_index):
                continue

            sensing = cav.setdefault("sensing", {})
            loc = sensing.setdefault("localization", {})
            gnss = loc.setdefault("gnss", {})

            # CRITICAL: activate=True is required.
            # Without it, localize() calls vehicle.get_transform() directly,
            # bypassing the GNSS sensor entirely — noise has zero effect and
            # localization_eval metrics stay at 0.000000.
            loc["activate"] = True
            loc.setdefault("dt", 0.05)

            gnss["noise_alt_stddev"] = noise["noise_alt_stddev"]
            gnss["noise_lat_stddev"] = noise["noise_lat_stddev"]
            gnss["noise_lon_stddev"] = noise["noise_lon_stddev"]

            log.info(
                "ATTACK spoofer → CAV%d | intensity=%s | "
                "alt_std=%.2f lat_std=%.2e lon_std=%.2e",
                idx, intensity,
                noise["noise_alt_stddev"],
                noise["noise_lat_stddev"],
                noise["noise_lon_stddev"],
            )


# ---------------------------------------------------------------------------
# Main conversion entry point
# ---------------------------------------------------------------------------

def json_to_single_cav_list(json_data: dict, carla_map=None) -> tuple[dict, list]:

    if "scenario" not in json_data or not isinstance(json_data["scenario"], list):
        raise ValueError("Invalid payload: 'scenario' must be a list")

    cav_list = []
    rsu_list = []
    pedestrian_list = []

    map_name = json_data.get("map", "Town10HD").replace(".xodr", "")
    _req      = json_data.get("map_offsets") or {}
    _fallback = MAP_OFFSETS.get(map_name, (0.0, 0.0))
    offset_x  = _req.get("x", _fallback[0])
    offset_y  = _req.get("y", _fallback[1])
    _offset_src = "frontend" if _req else "MAP_OFFSETS fallback"
    log.info(
        "=== SCENARIO SETUP === map=%s  offset_x=%.4f  offset_y=%.4f  source=%s",
        map_name, offset_x, offset_y, _offset_src,
    )
    if not _req:
        log.warning(
            "No map_offsets received from frontend — using hardcoded fallback "
            "MAP_OFFSETS[%r] = (%.4f, %.4f). Check ScenarioControlWidget.tsx.",
            map_name, _fallback[0], _fallback[1],
        )
    else:
        log.debug("map_offsets payload: %s  fallback would have been: %s", _req, _fallback)

    cav_index = 0
    for group in json_data["scenario"]:
        vehicle_type = group.get("vehicle")

        if vehicle_type == "car":
            for car in group["path"]:
                cav_index += 1
                points = car.get("points", [])
                dest   = points[-1] if points else None

                sx, sy, sz = convert_coords(
                    car["x"], car["y"], offset_x, offset_y,
                    carla_map=carla_map, is_spawn=True,
                )
                if dest:
                    dx, dy, dz = convert_coords(
                        dest["x"], dest["y"], offset_x, offset_y,
                        carla_map=carla_map, is_spawn=False,
                    )
                else:
                    dx, dy, dz = sx, sy, _FALLBACK_DEST_Z

                log.info("CAV%d spawn=(%.2f, %.2f, %.2f) dest=(%.2f, %.2f, %.2f)",
                         cav_index, sx, sy, sz, dx, dy, dz)

                spawn_yaw = _compute_yaw(sx, sy, sz, dx, dy, carla_map=carla_map)
                log.info("CAV%d spawn_yaw=%.1f deg", cav_index, spawn_yaw)

                # Guard: if both coords snap to the same waypoint, OpenCDA
                # would see an empty route and hold brake=1.0 indefinitely.
                # Nudge dest forward along the lane to fix this.
                if carla_map is not None:
                    dx, dy, dz = _nudge_dest_if_same_waypoint(
                        sx, sy, sz, dx, dy, dz, cav_index, carla_map
                    )

                log.info(
                    "=== CAV%d FINAL === "
                    "spawn=(%.2f, %.2f, %.2f) yaw=%.1f°  dest=(%.2f, %.2f, %.2f)  "
                    "dist_xy=%.1fm",
                    cav_index,
                    sx, sy, sz, spawn_yaw,
                    dx, dy, dz,
                    math.hypot(dx - sx, dy - sy),
                )

                destination_value = [dx, dy, dz]

                behavior: dict = {
                    "local_planner": {
                        "debug_trajectory": car.get("opencda_local_planner_debug_trajectory", True),
                        "debug":            car.get("opencda_local_planner_debug", True),
                    }
                }
                if car.get("opencda_max_speed") is not None:
                    behavior["max_speed"] = car["opencda_max_speed"]
                elif car.get("max_speed") is not None:
                    behavior["max_speed"] = car["max_speed"]
                if car.get("opencda_ignore_traffic_light") is not None:
                    behavior["ignore_traffic_light"] = car["opencda_ignore_traffic_light"]
                if car.get("opencda_overtake_allowed") is not None:
                    behavior["overtake_allowed"] = car["opencda_overtake_allowed"]
                if car.get("opencda_collision_time_ahead") is not None:
                    behavior["collision_time_ahead"] = car["opencda_collision_time_ahead"]

                v2x: dict = {"communication_range": 45}
                if car.get("opencda_v2x_communication_range") is not None:
                    v2x["communication_range"] = car["opencda_v2x_communication_range"]
                if car.get("opencda_v2x_enabled") is not None:
                    v2x["enabled"] = car["opencda_v2x_enabled"]

                cav: dict = {
                    "name": f"cav{cav_index}",
                    "spawn_position": [sx, sy, sz, 0, spawn_yaw, 0],
                    "destination": destination_value,
                    "behavior": behavior,
                    "v2x": v2x,
                }

                if car.get("opencda_carla_model"):
                    cav["carla_model"] = car["opencda_carla_model"]
                if car.get("opencda_color") is not None:
                    cav["color"] = car["opencda_color"]

                lidars = car.get("lidars", [])
                if lidars:
                    lidar = lidars[0]
                    cav["sensing"] = {
                        "perception": {
                            "activate": True,
                            "lidar": {
                                "channels":           lidar.get("channels", 32),
                                "range":              lidar.get("range", 50),
                                "rotation_frequency": lidar.get("rotation_frequency", 10),
                                "visualize":          lidar.get("visualize", False),
                            }
                        }
                    }

                cav_list.append(cav)

        elif vehicle_type == "RSU":
            for i, rsu in enumerate(group["path"], 1):
                log.debug(
                    "RSU%d: editor coords=(%.4f, %.4f)",
                    i, rsu["x"], rsu["y"],
                )
                rx, ry, rz = convert_coords(
                    rsu["x"], rsu["y"], offset_x, offset_y,
                    carla_map=carla_map, is_spawn=True,
                )
                log.info("=== RSU%d FINAL === spawn=(%.2f, %.2f, %.2f)", i, rx, ry, rz)

                rsu_entry = {
                    "name": rsu.get("opencda_name") or f"rsu{i}",
                    "spawn_position": [rx, ry, rz, 0, 0, 0],
                    "id": rsu.get("opencda_id") if rsu.get("opencda_id") is not None else i,
                    "v2x": {
                        "communication_range": rsu.get("range", 45),
                        "tx_power":            rsu.get("tx_power", 23),
                        "frequency":           rsu.get("frequency", 5.9e9),
                        "protocol":            rsu.get("protocol", "ITS-G5"),
                        "beacon_interval":     rsu.get("beacon_interval", 1000),
                    },
                    "sensing": {
                        "perception": {
                            "activate": rsu.get("opencda_perception_activate", False),
                            # detection_range: radius (metres) for server-side
                            # vehicle queries in deactivate_mode.
                            # RSUs default to 100 m (wider than moving CAVs at 50 m)
                            # so they contribute vehicles at intersections.
                            # Changing this in the UI directly changes what RSU sees.
                            "detection_range": rsu.get("opencda_detection_range", 100),
                            "camera": {
                                "visualize": rsu.get("opencda_camera_visualize", False),  # False = headless-safe (was 4 — truthy copy-paste from `num` below, crashed cv2.imshow every tick in deactivate_mode)
                                "num":       rsu.get("opencda_camera_num", 4),
                                "positions": rsu.get("opencda_camera_positions", [
                                    [2.5,  0.0,  1.0,   0],
                                    [0.0,  0.3,  1.8, 100],
                                    [0.0, -0.3,  1.8, -100],
                                    [-2.0, 0.0,  1.5, 180],
                                ]),
                            },
                            "lidar": {
                                "visualize":               rsu.get("opencda_lidar_visualize", False),  # False = headless-safe
                                "channels":                rsu.get("opencda_lidar_channels", 32),
                                "range":                   rsu.get("opencda_lidar_range", 120),
                                "points_per_second":       rsu.get("opencda_lidar_points_per_second", 1000000),
                                "rotation_frequency":      rsu.get("opencda_lidar_rotation_frequency", 20),
                                "upper_fov":               rsu.get("opencda_lidar_upper_fov", 2),
                                "lower_fov":               rsu.get("opencda_lidar_lower_fov", -25),
                                "dropoff_general_rate":    rsu.get("opencda_lidar_dropoff_general_rate", 0.3),
                                "dropoff_intensity_limit": rsu.get("opencda_lidar_dropoff_intensity_limit", 0.7),
                                "dropoff_zero_intensity":  rsu.get("opencda_lidar_dropoff_zero_intensity", 0.4),
                                "noise_stddev":            rsu.get("opencda_lidar_noise_stddev", 0.02),
                            },
                        },
                        "localization": {
                            "activate": rsu.get("opencda_localization_activate", True),
                            "dt": 0.05,  # literal value — OmegaConf interpolation breaks after merge
                            "gnss": {
                                "noise_alt_stddev": rsu.get("opencda_gnss_noise_alt_stddev", 0.05),
                                "noise_lat_stddev": rsu.get("opencda_gnss_noise_lat_stddev", 3e-6),
                                "noise_lon_stddev": rsu.get("opencda_gnss_noise_lon_stddev", 3e-6),
                            },
                        },
                    },
                }
                if rsu.get("opencda_color") is not None:
                    rsu_entry["color"] = rsu["opencda_color"]
                if rsu.get("opencda_behavior_services"):
                    rsu_entry["behavior_services"] = rsu["opencda_behavior_services"]
                rsu_list.append(rsu_entry)

        elif vehicle_type == "pedestrian":
            for i, ped in enumerate(group["path"], 1):
                px, py, pz = convert_coords(
                    ped["x"], ped["y"], offset_x, offset_y,
                    carla_map=carla_map, is_spawn=True,
                )
                log.info("=== PED%d FINAL === spawn=(%.2f, %.2f, %.2f)", i, px, py, pz)
                pedestrian_list.append({
                    "spawn": [px, py, pz],
                    "speed":         ped.get("speed", 1.4),
                    "cross_factor":  ped.get("cross_factor", 0.0),
                    "is_invincible": ped.get("is_invincible", True),
                })

        else:
            log.debug("Skipping unsupported vehicle type: %s", vehicle_type)

    # Force localization.activate=True with stock GNSS noise on every CAV,
    # attacked or not — base.yaml defaults activate to False, which bypasses
    # the GNSS+KF stack entirely (see _ensure_localization_baseline
    # docstring). Must run before _apply_attacks so attack runs simply
    # overwrite these stddevs with amplified values on an already-active
    # stack, keeping "no attack" and "attack" runs comparable.
    _ensure_localization_baseline(cav_list)

    # Apply attacks after all CAVs are built
    attacks = json_data.get("attacks", [])
    log.info("Attacks in payload: %d → %s", len(attacks), [a.get("name", "?") for a in attacks])
    if attacks:
        _apply_attacks(cav_list, attacks)

    scenario_section: dict = {
        "world": {
            "town": map_name,
        },
        "scenario": {
            "name":            json_data.get("scenario_name", "scenario"),
            "map":             map_name,
            "single_cav_list": cav_list,
        },
    }

    if rsu_list:
        scenario_section["scenario"]["rsu_list"] = rsu_list

    return scenario_section, pedestrian_list
