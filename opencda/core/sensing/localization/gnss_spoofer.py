"""Runtime GNSS position spoofing models."""

import logging
import math

import numpy as np

log = logging.getLogger(__name__)


class GnssDriftSpoofer(object):
    """Apply a bounded, gradually increasing offset to GNSS positions."""

    def __init__(self, config, dt, rng=None):
        self.start_time = self._non_negative(config, 'start_time', 0.0)
        self.ramp_duration = self._non_negative(
            config, 'ramp_duration', 0.0)
        self.lateral_offset = float(config.get('lateral_offset', 0.0))
        self.longitudinal_offset = float(
            config.get('longitudinal_offset', 0.0))
        self.drift_rate = self._non_negative(config, 'drift_rate', 0.0)
        self.jitter_stddev = self._non_negative(
            config, 'jitter_stddev', 0.0)
        self.max_offset = self._non_negative(config, 'max_offset', 0.0)
        self.dt = float(dt)
        self.rng = rng if rng is not None else np.random

        self._origin_timestamp = None
        self._step = 0

    @staticmethod
    def _non_negative(config, key, default):
        value = float(config.get(key, default))
        if value < 0:
            raise ValueError('%s must be non-negative' % key)
        return value

    def _elapsed(self, timestamp):
        timestamp = float(timestamp or 0.0)
        if self._origin_timestamp is None:
            self._origin_timestamp = timestamp

        sensor_elapsed = max(0.0, timestamp - self._origin_timestamp)
        elapsed = max(sensor_elapsed, self._step * self.dt)
        self._step += 1
        return elapsed

    def _local_bias(self, elapsed):
        active_time = elapsed - self.start_time
        if active_time <= 0.0:
            return 0.0, 0.0, False

        if self.ramp_duration > 0.0:
            ramp = min(active_time / self.ramp_duration, 1.0)
        else:
            ramp = 1.0

        longitudinal = self.longitudinal_offset * ramp
        lateral = self.lateral_offset * ramp

        drift_time = max(0.0, active_time - self.ramp_duration)
        extra_offset = self.drift_rate * drift_time
        base_norm = math.hypot(longitudinal, lateral)
        if extra_offset > 0.0:
            if base_norm > 0.0:
                scale = (base_norm + extra_offset) / base_norm
                longitudinal *= scale
                lateral *= scale
            else:
                lateral = extra_offset

        bias_norm = math.hypot(longitudinal, lateral)
        if self.max_offset > 0.0 and bias_norm > self.max_offset:
            scale = self.max_offset / bias_norm
            longitudinal *= scale
            lateral *= scale

        return longitudinal, lateral, True

    def apply(self, x, y, yaw, timestamp):
        """Return spoofed x/y and the applied world-frame offset."""
        elapsed = self._elapsed(timestamp)
        longitudinal, lateral, active = self._local_bias(elapsed)
        if not active:
            return x, y, 0.0, 0.0, elapsed, False

        if self.jitter_stddev > 0.0:
            longitudinal += self.rng.normal(0.0, self.jitter_stddev)
            lateral += self.rng.normal(0.0, self.jitter_stddev)

        yaw_rad = math.radians(yaw)
        dx = longitudinal * math.cos(yaw_rad) - lateral * math.sin(yaw_rad)
        dy = longitudinal * math.sin(yaw_rad) + lateral * math.cos(yaw_rad)
        return x + dx, y + dy, dx, dy, elapsed, True


class GnssStealthSpoofer(GnssDriftSpoofer):
    """
    A drift attack that caps its offset relative to the victim's Kalman
    filter's own GNSS trust level, instead of an arbitrary max_offset in
    meters.

    Rationale: GnssDriftSpoofer's max_offset is a fixed distance chosen
    by whoever configures the attack, with no relationship to what the
    target's filter would consider a plausible GNSS reading. That makes
    it easy to accidentally configure an attack that's either trivially
    detectable (offset far outside anything a real sensor would ever
    report) or, at the other extreme, too small to matter. A realistic
    attacker instead calibrates against the target's sensor
    characteristics: GNSS receiver noise specs are public/estimable
    (this is the R the victim's filter uses, expressed as sensor
    stddev — see localization_manager.py's gnss_R derivation), so an
    attacker aiming to stay unnoticed would keep the induced bias within
    some multiple of that stddev, e.g. "within the range a genuinely
    noisy — but not attacked — receiver could plausibly produce."

    What this attacker is explicitly NOT assumed to know: the filter's
    current state uncertainty (P) or the resulting innovation covariance
    S = H@P@H.T + R, both of which depend on the target's recent motion
    history and aren't something an external GNSS signal attacker has
    visibility into. Capping against R alone (not S) keeps the threat
    model honest — this is "attacker knows the sensor's noise spec," not
    "attacker has read access to the target's internal filter state."

    max_sigma (in stddevs of the R this actor's filter was actually
    configured with, combined radially via hypot — matching how
    _local_bias already treats bias_norm as one quantity rather than
    capping x/y independently) replaces max_offset. Everything else —
    ramp, drift_rate — is unchanged from GnssDriftSpoofer; only the cap
    in _local_bias's max_offset scaling step is recomputed in meters
    from sigma before that scaling runs.

    Caveat: jitter_stddev (inherited from GnssDriftSpoofer) is added
    AFTER _local_bias's max_offset cap is applied, same as in the
    parent class — so the deterministic bias component is guaranteed
    to stay within max_sigma, but bias + jitter combined technically
    isn't. Configuring a large jitter_stddev alongside a tight
    max_sigma undermines the stealth guarantee this class exists to
    provide; keep jitter_stddev modest (or 0) if the sigma cap actually
    needs to hold.
    """

    def __init__(self, config, dt, r_stddev_xy, rng=None):
        """
        Parameters
        ----------
        r_stddev_xy : tuple(float, float)
            (x_stddev, y_stddev) in meters — the same values used to
            build this actor's Kalman R (see geo_noise_to_meters).
            Passed in explicitly rather than recomputed here so this
            class doesn't need its own copy of the geo-reference /
            sensor-config plumbing localization_manager.py already
            has.
        """
        super().__init__(config, dt, rng=rng)
        if 'max_offset' in config:
            log.warning(
                "GnssStealthSpoofer ignores 'max_offset' — stealth mode "
                "caps its bias via 'max_sigma' (multiples of the "
                'target sensor stddev) instead, so the offset stays '
                'meaningful relative to what the filter actually '
                'trusts rather than an arbitrary flat distance.'
            )
        self.max_sigma = self._non_negative(config, 'max_sigma', 2.0)
        self._r_stddev_x, self._r_stddev_y = r_stddev_xy

        self.max_offset = self.max_sigma * math.hypot(
            self._r_stddev_x, self._r_stddev_y)