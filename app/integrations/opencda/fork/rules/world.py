import math
from collections.abc import Iterator, Mapping
from typing import Any

from app.integrations.opencda.fork.effective import EffectiveConfig
from app.integrations.opencda.fork.issues import ConfigIssue, error
from app.integrations.opencda.fork.rules.base import as_float, is_number

_STREAMING_KEYS = ("tile_stream_distance", "actor_active_distance")


def _positive(value: float | None) -> float | None:
    return value if value is not None and value > 0 else None


class WorldRule:
    """CARLA world settings, checked as in ScenarioManager.__init__ of the fork."""

    def check(self, config: EffectiveConfig) -> Iterator[ConfigIssue]:
        world = config.root.get("world")
        if not isinstance(world, Mapping):
            yield error("world.type", "world must be a mapping.", ("world",))
            return
        if not world.get("sync_mode"):
            yield error(
                "world.sync_mode",
                "The fork supports only synchronous mode.",
                ("world", "sync_mode"),
            )
            return
        yield from self._physics(world)
        yield from self._streaming(world)

    @staticmethod
    def _physics(world: Mapping[str, Any]) -> Iterator[ConfigIssue]:
        substepping = world.get("substepping", True)
        substeps = world.get("max_substeps", 10)
        # The fork passes both durations through float().
        durations = {
            key: _positive(as_float(world.get(key, default)))
            for key, default in (
                ("fixed_delta_seconds", None),
                ("max_substep_delta_time", 0.01),
            )
        }

        if not isinstance(substepping, bool):
            yield error(
                "world.substepping",
                "substepping must be a boolean.",
                ("world", "substepping"),
            )
        if (
            not isinstance(substeps, int)
            or isinstance(substeps, bool)
            or not 1 <= substeps <= 16
        ):
            yield error(
                "world.max_substeps",
                "max_substeps must be an integer from 1 to 16.",
                ("world", "max_substeps"),
            )
            return
        for key, value in durations.items():
            if value is None:
                yield error(f"world.{key}", f"{key} must be positive.", ("world", key))
        fixed_delta = durations["fixed_delta_seconds"]
        substep_delta = durations["max_substep_delta_time"]
        if fixed_delta is None or substep_delta is None:
            return

        max_physics_delta = substep_delta * substeps
        if (
            substepping is True
            and fixed_delta > max_physics_delta
            and not math.isclose(fixed_delta, max_physics_delta)
        ):
            yield error(
                "world.physics",
                "fixed_delta_seconds must not exceed max_substep_delta_time * "
                f"max_substeps ({fixed_delta} > {substep_delta} * {substeps}).",
                ("world", "fixed_delta_seconds"),
            )

    @staticmethod
    def _streaming(world: Mapping[str, Any]) -> Iterator[ConfigIssue]:
        spectator_as_ego = world.get("spectator_as_ego")
        if spectator_as_ego is not None and not isinstance(spectator_as_ego, bool):
            yield error(
                "world.spectator_as_ego",
                "spectator_as_ego must be a boolean.",
                ("world", "spectator_as_ego"),
            )

        distances: dict[str, float] = {}
        for key in _STREAMING_KEYS:
            if world.get(key) is None:
                continue
            distance = _positive(world[key] if is_number(world[key]) else None)
            if distance is None:
                yield error(f"world.{key}", f"{key} must be positive.", ("world", key))
            else:
                distances[key] = distance

        if len(distances) == len(_STREAMING_KEYS) and (
            distances["actor_active_distance"] > distances["tile_stream_distance"]
        ):
            yield error(
                "world.actor_active_distance",
                "actor_active_distance must not exceed tile_stream_distance.",
                ("world", "actor_active_distance"),
            )
