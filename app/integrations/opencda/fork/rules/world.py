import math
from collections.abc import Iterator, Mapping

from app.integrations.opencda.fork.effective import EffectiveConfig
from app.integrations.opencda.fork.issues import ConfigIssue, error
from app.integrations.opencda.fork.rules.base import as_float


class WorldRule:
    """CARLA world settings that depend on each other.

    Mirrors ScenarioManager.__init__ of the fork; the type and range of each
    field are checked by SchemaRule, so invalid values are skipped here.
    """

    def check(self, config: EffectiveConfig) -> Iterator[ConfigIssue]:
        world = config.root.get("world")
        if world is None:
            yield error("world.missing", "world is required.", ("world",))
            return
        if not isinstance(world, Mapping):
            return
        if world.get("sync_mode") is False:
            yield error(
                "world.sync_mode",
                "The fork supports only synchronous mode.",
                ("world", "sync_mode"),
            )

        fixed_delta = as_float(world.get("fixed_delta_seconds"))
        substep_delta = as_float(world.get("max_substep_delta_time", 0.01))
        substeps = world.get("max_substeps", 10)
        if (
            world.get("substepping", True) is True
            and fixed_delta is not None
            and substep_delta is not None
            and isinstance(substeps, int)
            and fixed_delta > substep_delta * substeps
            and not math.isclose(fixed_delta, substep_delta * substeps)
        ):
            yield error(
                "world.physics",
                "fixed_delta_seconds must not exceed max_substep_delta_time * "
                f"max_substeps ({fixed_delta} > {substep_delta} * {substeps}).",
                ("world", "fixed_delta_seconds"),
            )

        tile = as_float(world.get("tile_stream_distance"))
        active = as_float(world.get("actor_active_distance"))
        if tile is not None and active is not None and active > tile:
            yield error(
                "world.actor_active_distance",
                "actor_active_distance must not exceed tile_stream_distance.",
                ("world", "actor_active_distance"),
            )
