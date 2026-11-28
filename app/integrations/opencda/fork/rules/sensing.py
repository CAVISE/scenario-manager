from collections.abc import Callable, Iterator, Mapping

from app.integrations.opencda.fork.effective import AgentKind, EffectiveConfig
from app.integrations.opencda.fork.issues import (
    ConfigIssue,
    ConfigPath,
    error,
    warning,
)
from app.integrations.opencda.fork.rules.base import lookup, origin

_PERCEPTION = ("sensing", "perception")
_LOCALIZATION = ("sensing", "localization")
# The fork has window names for four cameras.
_MAX_SHOWN_CAMERAS = 4
_LOCALIZATION_PROVIDERS = frozenset({"gt", "sensor"})
_LOCALIZATION_ESTIMATORS = frozenset({"kf", "ekf"})
_MAP_MANAGER_MODES = frozenset({"disabled", "offroad_only", "full_bev"})


class PerceptionRule:
    """Perception settings the fork rejects when it creates the sensors."""

    def check(self, config: EffectiveConfig) -> Iterator[ConfigIssue]:
        for agent in config.agents:
            perception = lookup(agent.config, _PERCEPTION)
            if not isinstance(perception, Mapping):
                continue

            def at(*keys: str) -> ConfigPath:
                return origin(config, agent, (*_PERCEPTION, *keys))

            camera = _mapping(perception.get("camera"))
            lidar = _mapping(perception.get("lidar"))
            # The fork only tests truthiness, so any truthy value counts.
            activate = bool(perception.get("activate"))
            # The fork forces apply_ml off, and active perception needs it.
            if activate:
                yield error(
                    "sensing.perception.activate",
                    "perception.activate: true aborts the run in the fork; use "
                    "lidar.visualize or cooperative perception instead.",
                    at("activate"),
                )
            if perception.get("enabled") is False and (
                activate or camera.get("visualize") or lidar.get("visualize")
            ):
                yield error(
                    "sensing.perception.enabled",
                    "perception.enabled: false cannot be combined with activate, "
                    "camera.visualize or lidar.visualize.",
                    at("enabled"),
                )
            yield from _cameras(camera, activate, at)


def _cameras(
    camera: Mapping, activate: bool, at: Callable[..., ConfigPath]
) -> Iterator[ConfigIssue]:
    """Cameras are spawned when shown or used by perception."""
    visualize = camera.get("visualize")
    num = camera.get("num")
    positions = camera.get("positions")
    if not (visualize or activate) or not isinstance(num, int):
        return
    if isinstance(positions, list) and num != len(positions):
        yield error(
            "sensing.perception.camera.num",
            "camera.num must equal the number of camera.positions.",
            at("camera", "num"),
        )
    shown = visualize if isinstance(visualize, (int, float)) else 0
    if shown > _MAX_SHOWN_CAMERAS and num > _MAX_SHOWN_CAMERAS:
        yield error(
            "sensing.perception.camera.visualize",
            f"At most {_MAX_SHOWN_CAMERAS} cameras can be shown.",
            at("camera", "visualize"),
        )


def _mapping(value: object) -> Mapping:
    return value if isinstance(value, Mapping) else {}


class LocalizationRule:
    """Mirrors resolve_localization_provider and _create_estimator of the fork."""

    def check(self, config: EffectiveConfig) -> Iterator[ConfigIssue]:
        for agent in config.agents:
            localization = lookup(agent.config, _LOCALIZATION)
            # A missing or invalid section is reported by SchemaRule.
            if not isinstance(localization, Mapping):
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
