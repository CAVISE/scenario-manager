# -*- coding: utf-8 -*-
"""
Basic class for RSU(Roadside Unit) management.
"""
# Author: Runsheng Xu <rxx3386@ucla.edu>
# License: TDG-Attribution-NonCommercial-NoDistrib

from opencda.core.common.data_dumper import DataDumper
from opencda.core.common.rsu_trust import is_plausible_rsu_object
from opencda.core.common.v2x_manager import V2XManager
from opencda.core.sensing.perception.perception_manager import \
    PerceptionManager
from opencda.core.sensing.localization.rsu_localization_manager import \
    LocalizationManager


class RSUManager(object):
    """
    A class manager for RSU. An RSU has perception and localization
    modules to sense its surroundings, and a V2X module so that sharing
    that sensing information with nearby CAVs goes through the same
    noise/lag-modeled channel CAVs use to talk to each other, instead of
    a synchronous direct call into RSU-side state.

    Parameters
    ----------
    carla_world : carla.World
        CARLA simulation world, we need this for blueprint creation.

    config_yaml : dict
        The configuration dictionary of the RSU.

    carla_map : carla.Map
        The CARLA simulation map.

    cav_world : opencda object
        CAV World for simulation V2X communication.

    current_time : str
        Timestamp of the simulation beginning, this is used for data dump.

    data_dumping : bool
        Indicates whether to dump sensor data during simulation.

    Attributes
    ----------
    v2x_manager : opencda object
        The current V2X manager. RSUs are stationary and never
        GNSS-spoofed, so unlike CAVs they default loc/yaw/speed noise
        and lag to 0 rather than inheriting a CAV-oriented default.

    localizer : opencda object
        The current localization manager.

    perception_manager : opencda object
        The current V2X perception manager.

    data_dumper : opencda object
        Used for dumping sensor data.
    """
    def __init__(
            self,
            carla_world,
            config_yaml,
            carla_map,
            cav_world,
            current_time='',
            data_dumping=False):

        self.rid = config_yaml['id']
        # The id of rsu is always a negative int
        if self.rid > 0:
            self.rid = -self.rid

        # read map from the world everytime is time-consuming, so we need
        # explicitly extract here
        self.carla_map = carla_map

        # retrieve the configure for different modules
        sensing_config = config_yaml['sensing']
        sensing_config['localization']['global_position'] = \
            config_yaml['spawn_position']
        sensing_config['perception']['global_position'] = \
            config_yaml['spawn_position']

        # V2XManager requires 'enabled' and 'communication_range' keys
        # with no .get() fallback (see V2XManager.__init__). Existing
        # saved scenarios may have no 'v2x' section at all, or one
        # written before this RSU V2X integration existed (frontend
        # currently emits communication_range/tx_power/frequency/
        # protocol/beacon_interval but not 'enabled') -- so this is
        # built explicitly here rather than passed through, to stay
        # compatible with both. RSUs are stationary infrastructure
        # with precise positioning, unlike CAVs, so loc/yaw/speed
        # noise and lag default to 0 here instead of falling through
        # to V2XManager's own (CAV-oriented) per-key defaults.
        raw_v2x_config = config_yaml.get('v2x') or {}
        self.communication_range = raw_v2x_config.get(
            'communication_range', 45)
        # Multi-hop RSU-to-RSU perception relay. 0 (default) means
        # relay is off entirely -- this RSU only ever reports its own
        # local detections, exactly as before this feature existed.
        # Set >0 to relay a neighbor's (and, transitively, a
        # neighbor's neighbor's, up to this many hops) detections
        # onward too. See _relay_neighbor_objects for the cycle-safe
        # traversal and per-hop trust checking.
        self.max_relay_hops = raw_v2x_config.get('max_relay_hops', 0)
        v2x_config = {
            'enabled': raw_v2x_config.get('enabled', True),
            'communication_range': self.communication_range,
            'loc_noise': raw_v2x_config.get('loc_noise', 0.0),
            'yaw_noise': raw_v2x_config.get('yaw_noise', 0.0),
            'speed_noise': raw_v2x_config.get('speed_noise', 0.0),
            'lag': raw_v2x_config.get('lag', 0),
        }

        # v2x module. RSU ids are already unique negative ints within
        # cav_world._rsu_manager_dict; stringify for the same vid type
        # CAVs use (V2XManager only uses vid for self-exclusion against
        # cav_world.get_vehicle_managers(), which RSUs are never part
        # of, so there's no collision risk either way).
        self.v2x_manager = V2XManager(cav_world, v2x_config, str(self.rid))

        # localization module
        self.localizer = LocalizationManager(carla_world,
                                             sensing_config['localization'],
                                             self.carla_map)
        # perception module
        self.perception_manager = PerceptionManager(vehicle=None,
                                                    config_yaml=sensing_config['perception'],
                                                    cav_world=cav_world,
                                                    carla_world=carla_world,
                                                    data_dump=data_dumping,
                                                    infra_id=self.rid)
        if data_dumping:
            self.data_dumper = DataDumper(self.perception_manager,
                                          self.rid,
                                          save_time=current_time)
        else:
            self.data_dumper = None

        self.detected_objects: dict = {}
        self.relay_stats = {
            'objects_relayed_total': 0,
            'objects_rejected_implausible': 0,
        }

        cav_world.update_rsu_manager(self)

    def update_info(self):
        """
        Call V2X, perception and localization module to
        retrieve surrounding info an ego position.
        """
        # localization
        self.localizer.localize()

        ego_pos = self.localizer.get_ego_pos()
        ego_spd = self.localizer.get_ego_spd()

        # true_pos == ego_pos here even though RSU localization CAN be
        # GNSS-spoofed now (see rsu_localization_manager.py's optional
        # gnss_spoofing config) -- unlike CAVs, RSU has no separate
        # ground-truth channel to compare against (no
        # ground_truth_pose-equivalent), so the (possibly already
        # spoofed) localized position is reported as both.
        if ego_pos is not None:
            self.v2x_manager.update_info(ego_pos, ego_spd, ego_pos)

        objects = self.perception_manager.detect(ego_pos)

        if self.max_relay_hops > 0:
            relayed = self._relay_neighbor_objects(
                hops_remaining=self.max_relay_hops, visited={self.rid})
            if relayed:
                existing_ids = {
                    v.carla_id for v in objects.get('vehicles', [])
                    if v.carla_id != -1
                }
                new_vehicles = [
                    v for v in relayed if v.carla_id not in existing_ids
                ]
                objects = dict(objects)
                objects['vehicles'] = (
                    list(objects.get('vehicles', [])) + new_vehicles)
                self.relay_stats['objects_relayed_total'] += len(
                    new_vehicles)

        self.detected_objects = objects

    def _relay_neighbor_objects(self, hops_remaining, visited):
        """
        Recursively gather vehicle detections from this RSU's V2X
        neighbors (self.v2x_manager.rsu_nearby), and, transitively,
        their neighbors, up to hops_remaining hops.

        Cycle safety: visited accumulates every rid already visited in
        this traversal (starting with this RSU's own rid, passed in by
        update_info) and is checked before descending into a neighbor
        -- a mesh where A and B are mutual neighbors (the common case)
        cannot loop back through either of them, structurally, not
        heuristically.

        Trust: every object is checked with is_plausible_rsu_object
        against the RSU that actually reported it (the neighbor being
        read from at this recursion level), not against self or the
        RSU that started the traversal -- the same rule
        VehicleManager._merge_rsu_perception applies on the CAV side,
        shared via rsu_trust.py so both paths can never drift apart.

        Freshness note: a neighbor's rsu_nearby/detected_objects
        reflect whatever it last computed in its own update_info() --
        if this RSU's update_info() happens to run before that
        neighbor's in the same tick's iteration order, the relayed
        data lags by up to one tick. This is the same class of
        staleness V2X lag-modeling already accepts elsewhere in this
        codebase, not a bug specific to this path.

        Parameters
        ----------
        hops_remaining : int
            How many more hops this traversal may still descend.

        visited : set
            rids already visited in this traversal (mutated in place
            as recursion descends, matching how a caller-owned
            accumulator is conventionally threaded through a
            traversal like this).

        Returns
        -------
        vehicles : list
            Deduplicated (by carla_id) plausible objects gathered from
            all neighbors within range, not including anything already
            known to be self's own detection (that dedup happens in
            update_info, which knows its own objects; this method only
            dedupes across the neighbors it visits).
        """
        if hops_remaining <= 0:
            return []

        collected = {}
        for neighbor_rid, neighbor in self.v2x_manager.rsu_nearby.items():
            if neighbor_rid in visited:
                continue
            visited.add(neighbor_rid)

            neighbor_objects = neighbor.get_detected_objects()
            for v in neighbor_objects.get('vehicles', []):
                if v.carla_id == -1 or v.carla_id in collected:
                    continue
                if not is_plausible_rsu_object(v, neighbor):
                    self.relay_stats['objects_rejected_implausible'] += 1
                    continue
                collected[v.carla_id] = v

            for v in neighbor._relay_neighbor_objects(
                    hops_remaining - 1, visited):
                if v.carla_id not in collected:
                    collected[v.carla_id] = v

        return list(collected.values())

    def run_step(self):
        """
        Currently only used for dumping data.
        """
        # dump data
        if self.data_dumper:
            self.data_dumper.run_step(self.perception_manager,
                                      self.localizer,
                                      None)

    def get_detected_objects(self) -> dict:
        """
        Return objects detected by this RSU in the last tick, plus
        anything relayed in from neighboring RSUs when max_relay_hops
        is configured above 0 (see _relay_neighbor_objects). A CAV
        reading this has no way to tell which vehicles were seen
        directly versus relayed -- same transparency the CAV-side
        merge already has toward RSU-vs-CAV-detected objects.
        Called by V2XManager to share perception with nearby CAVs.
        """
        return self.detected_objects

    def destroy(self):
        """
        Destroy the actor vehicle
        """
        self.perception_manager.destroy()
        self.localizer.destroy()
