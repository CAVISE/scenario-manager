from opencda.core.plan.global_route_planner_dao import GlobalRoutePlannerDAO


class _Location:
    def __init__(self, x: float, y: float = 0.0, z: float = 0.0):
        self.x = x
        self.y = y
        self.z = z

    def distance(self, other: "_Location") -> float:
        return abs(self.x - other.x)


class _Waypoint:
    def __init__(self, x: float, successors=None):
        self.transform = type("Transform", (), {"location": _Location(x)})()
        self._successors = successors or []

    def next(self, _resolution: float):
        return self._successors


class _Map:
    def __init__(self, topology):
        self._topology = topology

    def get_topology(self):
        return self._topology


def test_topology_keeps_short_terminal_link_without_successor():
    entry = _Waypoint(0)
    exit_waypoint = _Waypoint(3)

    topology = GlobalRoutePlannerDAO(
        _Map([(entry, exit_waypoint)]), sampling_resolution=6.0
    ).get_topology()

    assert len(topology) == 1
    assert topology[0]["path"] == []


def test_topology_does_not_append_successor_beyond_short_link():
    """A coarse query must not borrow a waypoint from the next road."""
    next_road_waypoint = _Waypoint(20)
    entry = _Waypoint(0, successors=[next_road_waypoint])
    exit_waypoint = _Waypoint(3)

    topology = GlobalRoutePlannerDAO(
        _Map([(entry, exit_waypoint)]), sampling_resolution=6.0
    ).get_topology()

    assert topology[0]["path"] == []


def test_topology_keeps_long_terminal_link_when_sampling_stops_early():
    intermediate = _Waypoint(6)
    entry = _Waypoint(0, successors=[intermediate])
    exit_waypoint = _Waypoint(20)

    topology = GlobalRoutePlannerDAO(
        _Map([(entry, exit_waypoint)]), sampling_resolution=6.0
    ).get_topology()

    assert topology[0]["path"] == [intermediate]
