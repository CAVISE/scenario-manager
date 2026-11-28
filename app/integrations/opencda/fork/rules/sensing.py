from collections.abc import Iterator, Mapping

from app.integrations.opencda.fork.effective import AgentKind, EffectiveConfig
from app.integrations.opencda.fork.issues import ConfigIssue, error, warning
from app.integrations.opencda.fork.rules.base import lookup, origin

_LOCALIZATION = ("sensing", "localization")
_LOCALIZATION_PROVIDERS = frozenset({"gt", "sensor"})
_LOCALIZATION_ESTIMATORS = frozenset({"kf", "ekf"})
_MAP_MANAGER_MODES = frozenset({"disabled", "offroad_only", "full_bev"})


class PerceptionRule:
    """The fork always runs with apply_ml off, so active perception aborts the run."""

    def check(self, config: EffectiveConfig) -> Iterator[ConfigIssue]:
        keys = ("sensing", "perception", "activate")
        for agent in config.agents:
            if lookup(agent.config, keys) is True:
                yield error(
                    "sensing.perception.activate",
                    "perception.activate: true aborts the run in the fork; use "
                    "lidar.visualize or cooperative perception instead.",
                    origin(config, agent, keys),
                )


class LocalizationRule:
    """Mirrors resolve_localization_provider and _create_estimator of the fork."""

    def check(self, config: EffectiveConfig) -> Iterator[ConfigIssue]:
        for agent in config.agents:
            localization = lookup(agent.config, _LOCALIZATION)
            if not isinstance(localization, Mapping):
                yield error(
                    "sensing.localization",
                    "sensing.localization must be a mapping.",
                    origin(config, agent, _LOCALIZATION),
                )
                continue

            provider = localization.get("provider")
            if provider is None:
                activate = localization.get("activate")
                if not isinstance(activate, bool):
                    yield error(
                        "sensing.localization.provider",
                        "Set localization.provider or a boolean localization.activate.",
                        origin(config, agent, (*_LOCALIZATION, "activate")),
                    )
                    continue
                provider = "sensor" if activate else "gt"
            elif provider not in _LOCALIZATION_PROVIDERS:
                yield error(
                    "sensing.localization.provider",
                    "localization.provider must be 'gt' or 'sensor'.",
                    origin(config, agent, (*_LOCALIZATION, "provider")),
                )
                continue

            estimator = localization.get("estimator", "kf")
            if provider == "sensor" and estimator not in _LOCALIZATION_ESTIMATORS:
                yield error(
                    "sensing.localization.estimator",
                    "localization.estimator must be 'kf' or 'ekf'.",
                    origin(config, agent, (*_LOCALIZATION, "estimator")),
                )


class MapManagerRule:
    """map_manager.activate overrides map_manager.mode in the fork."""

    def check(self, config: EffectiveConfig) -> Iterator[ConfigIssue]:
        for agent in config.agents_of(AgentKind.CAV):
            map_manager = agent.config.get("map_manager")
            if not isinstance(map_manager, Mapping):
                continue
            if "activate" in map_manager:
                path = origin(config, agent, ("map_manager", "activate"))
                if isinstance(map_manager["activate"], bool):
                    yield warning(
                        "map_manager.activate",
                        "map_manager.activate is a legacy key and overrides "
                        "map_manager.mode; use mode instead.",
                        path,
                    )
                else:
                    yield error(
                        "map_manager.activate",
                        "map_manager.activate must be a boolean.",
                        path,
                    )
            elif map_manager.get("mode", "disabled") not in _MAP_MANAGER_MODES:
                yield error(
                    "map_manager.mode",
                    "map_manager.mode must be disabled, offroad_only or full_bev.",
                    origin(config, agent, ("map_manager", "mode")),
                )
