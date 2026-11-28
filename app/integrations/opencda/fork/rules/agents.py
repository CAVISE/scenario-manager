from collections.abc import Iterator
from typing import Any

from app.integrations.opencda.fork.effective import (
    AgentConfig,
    AgentKind,
    EffectiveConfig,
)
from app.integrations.opencda.fork.issues import ConfigIssue, error, warning
from app.integrations.opencda.fork.rules.base import is_number, lookup, origin


class AgentIdRule:
    """The fork replaces a missing, negative or repeated id with its own.

    References such as ``cav-3`` in attack and AdvCP configs then point to
    another agent, so this is reported even though the run would start.
    """

    def check(self, config: EffectiveConfig) -> Iterator[ConfigIssue]:
        for kind in AgentKind:
            seen: set[int] = set()
            for agent in config.agents_of(kind):
                agent_id = self._parse(agent.source.get("id"))
                path = (*agent.path, "id")
                if agent_id is None or agent_id < 0:
                    yield warning(
                        "agent.id",
                        f"id must be a non-negative integer, otherwise the fork "
                        f"assigns its own {kind.prefix}-N id.",
                        path,
                    )
                elif agent_id in seen:
                    yield warning(
                        "agent.id_duplicate",
                        f"{kind.prefix}-{agent_id} is already used; the fork will "
                        "assign another id.",
                        path,
                    )
                else:
                    seen.add(agent_id)

    @staticmethod
    def _parse(value: Any) -> int | None:
        try:
            return int(value)
        except (TypeError, ValueError):
            return None


def _is_position(value: Any, size: int) -> bool:
    return (
        isinstance(value, list)
        and len(value) >= size
        and all(is_number(item) for item in value[:size])
    )


class AgentPlacementRule:
    """Spawn point of every agent and destination of every CAV."""

    def check(self, config: EffectiveConfig) -> Iterator[ConfigIssue]:
        for agent in config.agents:
            if agent.kind is AgentKind.CAV:
                yield from self._cav(config, agent)
            elif not _is_position(agent.config.get("spawn_position"), 6):
                yield error(
                    "agent.spawn_position",
                    "spawn_position must contain 6 numbers.",
                    (*agent.path, "spawn_position"),
                )

    @staticmethod
    def _cav(config: EffectiveConfig, agent: AgentConfig) -> Iterator[ConfigIssue]:
        cav = agent.config
        if "spawn_special" not in cav and not _is_position(
            cav.get("spawn_position"), 6
        ):
            yield error(
                "agent.spawn_position",
                "spawn_position must contain 6 numbers, or spawn_special must be set.",
                (*agent.path, "spawn_position"),
            )

        # Like the fork, fall back to behavior.carla_autopilot.
        keys = (
            ("carla_autopilot",)
            if "carla_autopilot" in cav
            else ("behavior", "carla_autopilot")
        )
        autopilot = lookup(cav, keys, False)
        if not isinstance(autopilot, bool):
            yield error(
                "agent.carla_autopilot",
                "carla_autopilot must be a boolean.",
                origin(config, agent, keys),
            )
        elif not autopilot and not _is_position(cav.get("destination"), 3):
            yield error(
                "agent.destination",
                "destination must contain 3 numbers unless carla_autopilot is true.",
                (*agent.path, "destination"),
            )


class PlatoonRule:
    """Platoons are not implemented in the fork (CAVISE/OpenCDA#109)."""

    def check(self, config: EffectiveConfig) -> Iterator[ConfigIssue]:
        if lookup(config.root, ("scenario", "platoon_list")):
            yield error(
                "scenario.platoon_list",
                "Platoons are not supported by the fork yet.",
                ("scenario", "platoon_list"),
            )
