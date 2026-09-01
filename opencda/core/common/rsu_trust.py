# -*- coding: utf-8 -*-
"""
Plausibility checking for objects reported by an RSU, shared by both
consumers of RSU-reported perception data:

- VehicleManager._merge_rsu_perception (a CAV merging a directly
  nearby RSU's detections into its own local perception)
- RSUManager's neighbor relay (an RSU forwarding a neighboring RSU's
  detections onward, see rsu_manager.py's _relay_neighbor_objects)

Both need the identical rule, so it lives here once rather than as two
copies that could silently drift apart if only one were ever updated.
"""
# License: TDG-Attribution-NonCommercial-NoDistrib

import math


def is_plausible_rsu_object(v, rsu) -> bool:
    """
    Basic plausibility check on an object reported by an RSU, before
    it is merged into a consumer's own perception. This is not a full
    trust/reputation system (no cross-RSU consensus, no anomaly
    scoring over time) -- it's a cheap, explainable filter for the two
    things that are unambiguously wrong regardless of how or why they
    happened (RSU bug or a spoofed detected_objects payload):

    1. The object is further from the reporting RSU than the RSU's
       own configured communication_range -- an RSU cannot see past
       its own stated range, so this is physically impossible no
       matter how the data arrived.
    2. The object's reported velocity is NaN or infinite -- the same
       class of bug already fixed elsewhere in this codebase's
       evaluation/localization paths (NaN/Infinity injection), now
       also closed on the RSU-ingest side specifically.

    A real Sybil defense would need cross-referencing against other
    RSUs' reports or a CAV's own sensors -- deliberately out of scope
    here; this only rejects objects that are impossible on their own
    terms, regardless of who is asking (a CAV merging directly, or a
    neighboring RSU relaying onward).

    Parameters
    ----------
    v : ObstacleVehicle
        The reported object, as returned by
        RSUManager.get_detected_objects()['vehicles'].

    rsu : RSUManager
        The RSU that reported v. Only .localizer.get_ego_pos() and
        .communication_range are read.

    Returns
    -------
    plausible : bool
    """
    rsu_pos = rsu.localizer.get_ego_pos()
    if rsu_pos is None:
        return False

    distance = v.location.distance(rsu_pos.location)
    if distance > rsu.communication_range:
        return False

    speed = v.velocity
    speed_magnitude_sq = speed.x ** 2 + speed.y ** 2 + speed.z ** 2
    if not math.isfinite(speed_magnitude_sq):
        return False

    return True
