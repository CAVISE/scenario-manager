# -*- coding: utf-8 -*-
"""
Basic class for pedestrian V2X management.
"""
# License: TDG-Attribution-NonCommercial-NoDistrib

from opencda.core.common.v2x_manager import V2XManager


class PedestrianManager(object):
    """
    A class manager that gives an already-spawned CARLA pedestrian
    (walker + AI controller) a V2X presence, so nearby CAVs can
    discover it through the same noise/lag-modeled channel they use
    to discover RSUs and each other -- rather than pedestrians being
    invisible to V2X entirely, as they were before this class existed.

    This class does not spawn the walker/controller itself -- the
    caller (app/runner.py's _spawn_pedestrians) already does that, for
    reasons specific to this app layer (per-pedestrian try/except
    isolation during spawn, orphaned-walker cleanup on controller
    setup failure) that predate this class and aren't V2X-specific.
    PedestrianManager wraps the resulting (walker, controller) pair
    with a V2X module only.

    Unlike RSUManager/VehicleManager, this class has no
    PerceptionManager or LocalizationManager: pedestrians have no
    sensing stack in this simulation (nothing consumes "what a
    pedestrian sees"), and unlike a CAV's GNSS-based localization,
    a pedestrian's position/speed are read directly from the CARLA
    walker actor -- there's no separate estimate to compute, since
    pedestrians -- like RSUs -- are never GNSS-spoofed.

    Parameters
    ----------
    walker : carla.Walker
        The already-spawned CARLA walker actor.

    controller : carla.WalkerAIController
        The already-spawned and started AI controller attached to
        walker. Not used by this class directly (movement is already
        governed by the caller's go_to_location/set_max_speed calls),
        but held so a future caller doesn't need to track both this
        manager and the raw controller separately.

    config_yaml : dict
        This pedestrian's configuration dictionary, as produced by
        app/utils.py's pedestrian_list entries -- in particular its
        'v2x' sub-dict (tx_power/frequency/protocol/beacon_interval,
        added alongside this class; and communication_range/enabled/
        loc_noise/yaw_noise/speed_noise/lag, following the same
        optional-key shape RSUManager already accepts).

    cav_world : opencda object
        CAV World for simulation V2X communication.

    Attributes
    ----------
    pid : int
        This pedestrian's identifier -- the underlying CARLA walker
        actor's own id, reused directly rather than minted separately
        (it's already unique, and reusing it makes cross-referencing
        simulation logs against CARLA's own actor list straightforward).

    v2x_manager : opencda object
        The current V2X manager. Pedestrians are never GNSS-spoofed
        (their position is read directly from the CARLA walker actor,
        not estimated), so -- like RSUManager -- this defaults loc/
        yaw/speed noise and lag to 0 rather than inheriting
        V2XManager's own CAV-oriented per-key defaults.
    """

    def __init__(self, walker, controller, config_yaml, cav_world):
        self.walker = walker
        self.controller = controller
        self.pid = walker.id

        # Same reasoning as RSUManager: V2XManager requires 'enabled'
        # and 'communication_range' with no .get() fallback, and
        # existing saved scenarios (or ones from before this class
        # existed) may have no 'v2x' section, or one shaped like what
        # app/utils.py now emits (communication_range/tx_power/
        # frequency/protocol/beacon_interval, no 'enabled') -- so this
        # is built explicitly here rather than passed through.
        raw_v2x_config = config_yaml.get('v2x') or {}
        self.communication_range = raw_v2x_config.get(
            'communication_range', 45)
        v2x_config = {
            'enabled': raw_v2x_config.get('enabled', True),
            'communication_range': self.communication_range,
            'loc_noise': raw_v2x_config.get('loc_noise', 0.0),
            'yaw_noise': raw_v2x_config.get('yaw_noise', 0.0),
            'speed_noise': raw_v2x_config.get('speed_noise', 0.0),
            'lag': raw_v2x_config.get('lag', 0),
        }

        # v2x module. Pedestrian ids (CARLA actor ids) live in their
        # own cav_world._pedestrian_manager_dict, separate from CAV
        # vids (uuid strings) and RSU rids (negative ints) -- no
        # namespace collision risk, same as RSUManager's rid reuse.
        self.v2x_manager = V2XManager(cav_world, v2x_config, str(self.pid))

        cav_world.update_pedestrian_manager(self)

    def get_ego_pos(self):
        """
        Return this pedestrian's current position, read directly from
        the CARLA walker actor.

        Returns
        -------
        transform : carla.Transform or None
            None if the walker actor is no longer alive (e.g. it was
            destroyed by CARLA outside this manager's control) --
            callers already handle a None position the same way for
            RSUs (see V2XManager.search()'s rsu_pos is None check).
        """
        if not self.walker.is_alive:
            return None
        return self.walker.get_transform()

    def get_ego_spd(self):
        """
        Return this pedestrian's current speed in km/h, computed from
        the CARLA walker actor's velocity vector.

        Returns
        -------
        speed : float
            0.0 if the walker actor is no longer alive.
        """
        if not self.walker.is_alive:
            return 0.0
        v = self.walker.get_velocity()
        # m/s -> km/h, same conversion LocalizationManager.get_ego_spd
        # uses for CAVs.
        return 3.6 * (v.x ** 2 + v.y ** 2 + v.z ** 2) ** 0.5

    def update_info(self):
        """
        Push this pedestrian's current position/speed into its own
        v2x_manager, so nearby CAVs see an up-to-date (noise/lag
        -modeled) position when they search() for it.
        """
        ego_pos = self.get_ego_pos()
        ego_spd = self.get_ego_spd()

        # Pedestrians are never GNSS-spoofed (position comes straight
        # from the CARLA walker actor), so true_pos == ego_pos here --
        # same reasoning as RSUManager.update_info.
        if ego_pos is not None:
            self.v2x_manager.update_info(ego_pos, ego_spd, ego_pos)

    def destroy(self):
        """
        This does NOT destroy the underlying walker/controller CARLA
        actors -- app/runner.py's _destroy_pedestrians already owns
        that cleanup (it destroys the controller and walker it spawned
        directly, independent of whether a PedestrianManager wraps
        them), and destroying them a second time here would raise on
        an already-destroyed actor. This exists only for symmetry with
        RSUManager/VehicleManager's destroy() and cav_world.destroy()'s
        uniform loop over all three manager dicts; there's currently
        no separate v2x_manager-internal state to release (V2XManager
        itself has no destroy() method, on either the CAV or RSU side).
        """
        pass
