# -*- coding: utf-8 -*-
"""Runtime GNSS position spoofing models."""

import math

import numpy as np


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
