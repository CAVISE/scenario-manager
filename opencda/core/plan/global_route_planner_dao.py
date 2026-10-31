# Copyright (c) # Copyright (c) 2018-2020 CVC.
#
# This work is licensed under the terms of the MIT license.
# For a copy, see <https://opensource.org/licenses/MIT>.

"""
This module provides implementation for GlobalRoutePlannerDAO
"""

import numpy as np


class GlobalRoutePlannerDAO(object):
    """
    This class is the data access layer for fetching data from the carla
    server instance for GlobalRoutePlanner.

    Parameters
    -wmap : carla.world
        The current carla simulation world.
    -sampling_resolution : float
        sampling distance between waypoints.

    """

    def __init__(self, wmap, sampling_resolution):

        self._sampling_resolution = sampling_resolution
        self._wmap = wmap

    def get_topology(self):
        """
        Accessor for topology.
        This function retrieves topology from the server as a list of
        road segments as pairs of waypoint objects, and processes the
        topology into a list of dictionary objects.

            :return topology:
                entry   -   waypoint of entry point of road segment
                entryxyz-   (x,y,z) of entry point of road segment
                exit    -   waypoint of exit point of road segment
                exitxyz -   (x,y,z) of exit point of road segment
                path    -   list of waypoints separated by 1m from entry
                            to exit
        """
        topology = []
        # Retrieving waypoints to construct a detailed topology
        for segment in self._wmap.get_topology():
            wp1, wp2 = segment[0], segment[1]
            l1, l2 = wp1.transform.location, wp2.transform.location
            # Rounding off to avoid floating point imprecision
            x1, y1, z1, x2, y2, z2 = np.round(
                [l1.x, l1.y, l1.z, l2.x, l2.y, l2.z], 0)
            wp1.transform.location, wp2.transform.location = l1, l2
            seg_dict = dict()
            seg_dict['entry'], seg_dict['exit'] = wp1, wp2
            seg_dict['entryxyz'], seg_dict['exitxyz'] = (
                x1, y1, z1), (x2, y2, z2)
            seg_dict['path'] = []
            endloc = wp2.transform.location
            if wp1.transform.location.distance(
                    endloc) > self._sampling_resolution:
                next_waypoints = wp1.next(self._sampling_resolution)
                if not next_waypoints:
                    # Some OSM-derived OpenDRIVE links terminate before the
                    # requested sampling step.  The topology pair itself is
                    # still a valid graph edge; it simply has no sampled
                    # intermediate waypoints.
                    topology.append(seg_dict)
                    continue
                w = next_waypoints[0]
                while w.transform.location.distance(
                        endloc) > self._sampling_resolution:
                    seg_dict['path'].append(w)
                    next_waypoints = w.next(self._sampling_resolution)
                    if not next_waypoints:
                        break
                    w = next_waypoints[0]
            # A topology segment shorter than the sampling resolution is
            # already represented exactly by its entry and exit waypoints.
            # Calling ``wp1.next(resolution)`` here can jump through a short
            # OpenDRIVE junction connector into the following road.  The
            # foreign waypoint then becomes part of this edge and a vehicle
            # receives a route that cuts across the junction.  Keep the path
            # empty; GlobalRoutePlanner.trace_route always emits the two
            # topology endpoints and later densifies the selected route.
            topology.append(seg_dict)
        return topology

    def get_waypoint(self, location):
        """
        The method returns waypoint at given location.

        Args:
            -location (carla.lcoation): Vehicle location.
        Returns:
            -waypoint (carla.waypoint): Newly generated waypoint close
            to location.
        """
        waypoint = self._wmap.get_waypoint(location)
        return waypoint

    def get_resolution(self):
        """ Return the sampling resolution."""
        return self._sampling_resolution
