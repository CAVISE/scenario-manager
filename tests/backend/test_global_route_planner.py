import sys
import types


# The ordinary backend test image omits NetworkX, while this focused test only
# exercises waypoint resampling and never constructs a graph.
sys.modules.setdefault("networkx", types.ModuleType("networkx"))

from opencda.core.plan.global_route_planner import GlobalRoutePlanner  # noqa: E402


class _Location:
    def __init__(self, x: float):
        self.x = x
        self.y = 0.0
        self.z = 0.0

    def distance(self, other: "_Location") -> float:
        return abs(self.x - other.x)


class _Waypoint:
    def __init__(self, x: float, *, is_junction: bool = False):
        self.transform = type("Transform", (), {"location": _Location(x)})()
        self._successors = []
        self.is_junction = is_junction
        self.next_resolutions = []

    def next(self, resolution: float):
        self.next_resolutions.append(resolution)
        return self._successors


class _Dao:
    def get_resolution(self):
        return 20.0


def test_densify_path_resamples_coarse_osm_route_on_carla_lane():
    waypoints = [_Waypoint(position) for position in (0, 4.5, 9, 13.5, 18, 20)]
    for current, following in zip(waypoints, waypoints[1:]):
        current._successors = [following]

    planner = GlobalRoutePlanner(_Dao())
    dense = planner._densify_path([waypoints[0], waypoints[-1]])

    assert [waypoint.transform.location.x for waypoint in dense] == [
        0,
        4.5,
        9,
        13.5,
        18,
        20,
    ]


def test_densify_path_uses_fine_steps_inside_a_junction():
    waypoints = [
        _Waypoint(position, is_junction=True) for position in (0, 0.5, 1.0, 1.5, 2.0)
    ]
    for current, following in zip(waypoints, waypoints[1:]):
        current._successors = [following]

    planner = GlobalRoutePlanner(_Dao())
    dense = planner._densify_path([waypoints[0], waypoints[-1]])

    assert [waypoint.transform.location.x for waypoint in dense] == [
        0,
        0.5,
        1.0,
        1.5,
        2.0,
    ]
    assert waypoints[0].next_resolutions == [0.5]
