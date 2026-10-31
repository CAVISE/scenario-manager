from unittest.mock import MagicMock

import pytest

try:
    from opencda.core.plan.behavior_agent import BehaviorAgent
except ModuleNotFoundError as exc:
    pytest.skip(
        f"simulation dependency is not installed: {exc.name}",
        allow_module_level=True,
    )


def make_agent(*, lane_change_allowed):
    agent = BehaviorAgent.__new__(BehaviorAgent)
    agent.destination_push_flag = 0
    agent.overtake_counter = 0
    agent.lane_change_management = MagicMock(return_value=lane_change_allowed)
    agent.get_local_planner = MagicMock(
        return_value=MagicMock(
            lane_id_change=True,
            lane_lateral_change=True,
        )
    )
    return agent


def test_curve_does_not_mark_lane_change_as_blocked():
    agent = make_agent(lane_change_allowed=False)

    allowed = agent.check_lane_change_permission(
        lane_change_allowed=True,
        collision_detector_enabled=True,
        rk=[0.05, 0.06, 0.05],
    )

    assert allowed is False
    assert agent.lane_change_blocked is False
    agent.lane_change_management.assert_not_called()


def test_adjacent_vehicle_marks_lane_change_as_blocked():
    agent = make_agent(lane_change_allowed=False)

    allowed = agent.check_lane_change_permission(
        lane_change_allowed=True,
        collision_detector_enabled=True,
        rk=[0.0, 0.01, 0.0],
    )

    assert allowed is False
    assert agent.lane_change_blocked is True
    agent.lane_change_management.assert_called_once_with()


def test_destination_prefers_reachable_editor_lane_over_shorter_neighbour():
    """Do not create a lane change merely to save a fraction of a metre."""
    agent = BehaviorAgent.__new__(BehaviorAgent)
    requested = MagicMock()
    raw = MagicMock(lane_id=-2)
    neighbour = MagicMock(lane_id=-1)
    raw.transform.location.distance.return_value = 1.2
    neighbour.transform.location.distance.return_value = 4.7
    agent.start_waypoint = MagicMock(lane_id=-2)
    agent._end_waypoint_candidates = MagicMock(
        return_value=[("nearest", raw), ("left", neighbour)]
    )
    agent._trace_route = MagicMock(side_effect=lambda _start, end: [(end, None)])
    agent._route_distance = MagicMock(
        side_effect=lambda route: 767.7 if route[0][0] is raw else 767.1
    )

    selected, route = agent._select_destination_route(raw, requested)

    assert selected is raw
    assert route == [(raw, None)]
