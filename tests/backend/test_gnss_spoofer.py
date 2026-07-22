import pytest

from opencda.core.sensing.localization.gnss_spoofer import GnssDriftSpoofer


class _ZeroJitter:
    @staticmethod
    def normal(_mean, _stddev):
        return 0.0


def _spoofer(**overrides):
    config = {
        "start_time": 10,
        "ramp_duration": 8,
        "lateral_offset": 1.8,
        "longitudinal_offset": 0.5,
        "drift_rate": 0.08,
        "jitter_stddev": 0.08,
        "max_offset": 3,
    }
    config.update(overrides)
    return GnssDriftSpoofer(config, dt=0.05, rng=_ZeroJitter())


def test_drift_starts_after_delay_and_ramps_in_vehicle_frame():
    spoofer = _spoofer(drift_rate=0)

    assert spoofer.apply(10, 20, 0, 100)[:2] == (10, 20)
    assert spoofer.apply(10, 20, 0, 109)[:2] == (10, 20)

    x, y, _, _, elapsed, active = spoofer.apply(10, 20, 0, 114)
    assert active is True
    assert elapsed == pytest.approx(14)
    assert x == pytest.approx(10.25)
    assert y == pytest.approx(20.9)


def test_drift_rotates_with_vehicle_heading_and_respects_max_offset():
    spoofer = _spoofer(
        start_time=0,
        ramp_duration=0,
        lateral_offset=0,
        longitudinal_offset=2,
        drift_rate=1,
        max_offset=3,
    )
    spoofer.apply(0, 0, 90, 0)

    x, y, dx, dy, _, active = spoofer.apply(0, 0, 90, 10)
    assert active is True
    assert x == pytest.approx(0, abs=1e-12)
    assert y == pytest.approx(3)
    assert dx == pytest.approx(0, abs=1e-12)
    assert dy == pytest.approx(3)


def test_drift_rejects_negative_time_parameters():
    with pytest.raises(ValueError, match="ramp_duration"):
        _spoofer(ramp_duration=-1)
