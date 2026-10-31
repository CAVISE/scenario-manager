from types import SimpleNamespace

from app.integrations.opencda.telemetry import map_position_diagnostics


class _Location:
    def __init__(self, x, y, z):
        self.x, self.y, self.z = x, y, z

    def distance(self, other):
        return (
            (self.x - other.x) ** 2 + (self.y - other.y) ** 2 + (self.z - other.z) ** 2
        ) ** 0.5


class _Waypoint:
    def __init__(self, location):
        self.road_id = 42
        self.lane_id = -1
        self.s = 12.345
        self.transform = SimpleNamespace(location=location)


class _Map:
    def __init__(self, exact, nearest):
        self.exact, self.nearest = exact, nearest

    def get_waypoint(self, _location, project_to_road, lane_type):
        assert lane_type == 1
        return self.nearest if project_to_road else self.exact


class _World:
    def ground_projection(self, _location, _distance):
        return SimpleNamespace(location=_Location(1, 2, 0))


class _Carla:
    LaneType = SimpleNamespace(Driving=1)

    class Location(_Location):
        def __init__(self, **kwargs):
            super().__init__(kwargs["x"], kwargs["y"], kwargs["z"])


def test_map_position_diagnostics_reports_exact_nearest_and_surface():
    location = _Location(1, 2, -0.5)
    report = map_position_diagnostics(
        _Map(None, _Waypoint(_Location(4, 2, 0))), _World(), location, _Carla
    )

    assert report["exact"] is None
    assert report["nearest"] == {
        "road": 42,
        "lane": -1,
        "s": 12.35,
        "location": "(4.00,2.00,0.00)",
    }
    assert report["nearest_distance_m"] == 3.04
    assert report["surface"] == "(1.00,2.00,0.00)"
    assert report["surface_vertical_gap_m"] == 0.5
