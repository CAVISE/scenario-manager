import math

import pytest

from opencda.core.sensing.localization.kalman_filter import (
    KalmanFilter,
    normalize_angle,
)
from opencda.core.sensing.localization.localization_debug_helper import (
    angle_difference_degrees,
)
from opencda.customize.core.sensing.localization.extented_kalman_filter import (
    ExtentedKalmanFilter,
)


@pytest.mark.parametrize("filter_class", [KalmanFilter, ExtentedKalmanFilter])
def test_filter_uses_shortest_yaw_innovation_across_wraparound(filter_class):
    kalman_filter = filter_class(0.05)
    measured_heading = math.radians(179)
    kalman_filter.run_step_init(0, 0, math.radians(-179), 0)

    _, _, filtered_heading, _ = kalman_filter.run_step(
        0, 0, measured_heading, 0, 0)

    heading_error = normalize_angle(filtered_heading - measured_heading)
    assert math.degrees(abs(heading_error)) < 5
    assert -math.pi <= filtered_heading < math.pi


def test_filter_normalizes_predicted_heading():
    kalman_filter = KalmanFilter(0.05)
    kalman_filter.run_step_init(0, 0, math.radians(179), 0)

    _, _, filtered_heading, _ = kalman_filter.run_step(
        0, 0, math.radians(-179), 0, math.radians(80))

    assert -math.pi <= filtered_heading < math.pi


def test_yaw_error_metric_uses_shortest_angle():
    error = angle_difference_degrees([179, -179], [-179, 179])

    assert error.tolist() == pytest.approx([-2, 2])
