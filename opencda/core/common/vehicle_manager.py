# -*- coding: utf-8 -*-
"""
Basic class of CAV
"""
# Author: Runsheng Xu <rxx3386@ucla.edu>
# License: TDG-Attribution-NonCommercial-NoDistrib

import uuid

from opencda.core.actuation.control_manager \
    import ControlManager
from opencda.core.application.platooning.platoon_behavior_agent\
    import PlatooningBehaviorAgent
from opencda.core.common.v2x_manager \
    import V2XManager
from opencda.core.sensing.localization.localization_manager \
    import LocalizationManager
from opencda.core.sensing.perception.perception_manager \
    import PerceptionManager
from opencda.core.safety.safety_manager import SafetyManager
from opencda.core.plan.behavior_agent \
    import BehaviorAgent
from opencda.core.map.map_manager import MapManager
from opencda.core.common.data_dumper import DataDumper


class VehicleManager(object):
    """
    A class manager to embed different modules with vehicle together.

    Parameters
    ----------
    vehicle : carla.Vehicle
        The carla.Vehicle. We need this class to spawn our gnss and imu sensor.

    config_yaml : dict
        The configuration dictionary of this CAV.

    application : list
        The application category, currently support:['single','platoon'].

    carla_map : carla.Map
        The CARLA simulation map.

    cav_world : opencda object
        CAV World. This is used for V2X communication simulation.

    current_time : str
        Timestamp of the simulation beginning, used for data dumping.

    data_dumping : bool
        Indicates whether to dump sensor data during simulation.

    Attributes
    ----------
    v2x_manager : opencda object
        The current V2X manager.

    localizer : opencda object
        The current localization manager.

    perception_manager : opencda object
        The current V2X perception manager.

    agent : opencda object
        The current carla agent that handles the basic behavior
         planning of ego vehicle.

    controller : opencda object
        The current control manager.

    data_dumper : opencda object
        Used for dumping sensor data.
    """

    def __init__(
            self,
            vehicle,
            config_yaml,
            application,
            carla_map,
            cav_world,
            current_time='',
            data_dumping=False):

        # an unique uuid for this vehicle
        self.vid = str(uuid.uuid1())
        self.vehicle = vehicle
        self.carla_map = carla_map

        # retrieve the configure for different modules
        sensing_config = config_yaml['sensing']
        map_config = config_yaml['map_manager']
        behavior_config = config_yaml['behavior']
        control_config = config_yaml['controller']
        v2x_config = config_yaml['v2x']
        localization_config = sensing_config['localization']

        self.navigation_source = localization_config.get(
            'navigation_source', 'ground_truth')
        self.v2x_position_source = v2x_config.get(
            'position_source', 'estimated')

        # v2x module
        self.v2x_manager = V2XManager(cav_world, v2x_config, self.vid)
        # localization module
        self.localizer = LocalizationManager(
            vehicle, sensing_config['localization'], carla_map)
        # perception module
        self.perception_manager = PerceptionManager(
            vehicle, sensing_config['perception'], cav_world,
            data_dumping)
        # map manager
        self.map_manager = MapManager(vehicle,
                                      carla_map,
                                      map_config)
        # safety manager
        self.safety_manager = SafetyManager(cav_world=cav_world,
                                            vehicle=vehicle,
                                            params=config_yaml['safety_manager'])
        # behavior agent
        self.agent = None
        if 'platooning' in application:
            platoon_config = config_yaml['platoon']
            self.agent = PlatooningBehaviorAgent(
                vehicle,
                self,
                self.v2x_manager,
                behavior_config,
                platoon_config,
                carla_map)
        else:
            self.agent = BehaviorAgent(vehicle, carla_map, behavior_config)

        # Control module
        self.controller = ControlManager(control_config)

        if data_dumping:
            self.data_dumper = DataDumper(self.perception_manager,
                                          vehicle.id,
                                          save_time=current_time)
        else:
            self.data_dumper = None

        cav_world.update_vehicle_manager(self)

        from collections import deque as _deque
        self.gt_dynamic_trace = _deque()
        self.ground_truth_pose = None
        self.estimated_pose = None
        self.navigation_pose = None
        self.transmitted_pose = None

        # Distinguish RSU coverage from useful merged detections.
        self.rsu_merge_stats = {
            'ticks_total': 0,
            'ticks_rsu_in_range': 0,
            'objects_merged_total': 0,
        }

    def set_destination(
            self,
            start_location,
            end_location,
            clean=False,
            end_reset=True):
        """
        Set global route.

        Parameters
        ----------
        start_location : carla.location
            The CAV start location.

        end_location : carla.location
            The CAV destination.

        clean : bool
             Indicator of whether clean waypoint queue.

        end_reset : bool
            Indicator of whether reset the end location.

        Returns
        -------
        """

        self.agent.set_destination(
            start_location, end_location, clean, end_reset)

    def update_info(self):
        """
        Call perception and localization module to
        retrieve surrounding info an ego position.
        """
        self.localizer.localize()

        self.estimated_pose = self.localizer.get_estimated_ego_pos()
        estimated_spd = self.localizer.get_estimated_ego_spd()

        self.ground_truth_pose = self.localizer.get_true_ego_pos()
        ground_truth_spd = self.localizer.get_true_ego_spd()

        if self.navigation_source == 'estimated':
            self.navigation_pose = self.estimated_pose
            navigation_spd = estimated_spd
        else:
            self.navigation_pose = self.ground_truth_pose
            navigation_spd = ground_truth_spd

        if self.v2x_position_source == 'ground_truth':
            self.transmitted_pose = self.ground_truth_pose
            transmitted_spd = ground_truth_spd
        else:
            self.transmitted_pose = self.estimated_pose
            transmitted_spd = estimated_spd

        # Sensors observe the physical world, independent of the navigation pose.
        objects = self.perception_manager.detect(self.ground_truth_pose)

        # Safety checks use physical rather than spoofed coordinates.
        self.map_manager.update_information(self.ground_truth_pose)

        safety_input = {
            'ego_pos': self.ground_truth_pose,
            'ego_speed': ground_truth_spd,
            'objects': objects,
            'carla_map': self.carla_map,
            'world': self.vehicle.get_world(),
            'static_bev': self.map_manager.static_bev,
            'vis_bev': self.map_manager.vis_bev,
        }
        self.safety_manager.update_info(safety_input)

        self.v2x_manager.update_info(
            self.transmitted_pose,
            transmitted_spd,
            self.ground_truth_pose,
        )

        self.gt_dynamic_trace.append(self.ground_truth_pose)

        self.rsu_merge_stats['ticks_total'] += 1
        if self.v2x_manager.rsu_nearby:
            self.rsu_merge_stats['ticks_rsu_in_range'] += 1
        objects = self._merge_rsu_perception(objects)

        self.agent.update_information(
            self.navigation_pose, navigation_spd, objects)
        self.controller.update_info(
            self.navigation_pose, navigation_spd)

    def _merge_rsu_perception(self, objects: dict) -> dict:
        """
        Merge vehicle detections from nearby RSUs into the local objects dict.

        RSUs act as infrastructure sensors — they see vehicles that may be
        outside the ego CAV's own perception range (e.g. around corners or
        at intersections). The merged list is deduplicated by CARLA actor id.

        Returns a new dict so the original is not mutated.
        """
        if not self.v2x_manager.rsu_nearby:
            return objects

        existing_ids: set = {
            v.carla_id
            for v in objects.get('vehicles', [])
            if v.carla_id != -1
        }

        extra_vehicles = []
        for rsu in self.v2x_manager.rsu_nearby.values():
            rsu_objects = rsu.get_detected_objects()
            for v in rsu_objects.get('vehicles', []):
                if v.carla_id == -1:
                    continue
                if v.carla_id == self.vehicle.id:
                    continue  # skip self
                if v.carla_id not in existing_ids:
                    extra_vehicles.append(v)
                    existing_ids.add(v.carla_id)

        self.rsu_merge_stats['objects_merged_total'] += len(extra_vehicles)

        merged = dict(objects)
        merged['vehicles'] = list(objects.get('vehicles', [])) + extra_vehicles
        return merged

    def run_step(self, target_speed=None):
        """
        Execute one step of navigation.
        """
        # visualize the bev map if needed
        self.map_manager.run_step()
        target_speed, target_pos = self.agent.run_step(target_speed)
        control = self.controller.run_step(target_speed, target_pos)

        # dump data
        if self.data_dumper:
            self.data_dumper.run_step(self.perception_manager,
                                      self.localizer,
                                      self.agent)

        return control

    def destroy(self):
        """
        Destroy the actor vehicle
        """
        self.perception_manager.destroy()
        self.localizer.destroy()
        self.vehicle.destroy()
        self.map_manager.destroy()
