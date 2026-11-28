"""Build the config the fork actually runs with.

The fork merges the scenario over ``default.yaml`` and then builds every agent
from ``agent_base``, ``vehicle_base`` or ``rsu_base`` and the agent entry.
Rules check this merged result, so inherited values are taken into account.
"""

import re
from collections.abc import Iterator, Mapping
from dataclasses import dataclass
from enum import Enum
from typing import Any

from omegaconf import OmegaConf
from omegaconf.errors import OmegaConfBaseException

from app.integrations.opencda.fork.issues import ConfigIssue, ConfigPath, error

_FULL_KEY_PART = re.compile(r"([^.\[\]]+)|\[(\d+)\]")


class AgentKind(Enum):
    CAV = ("cav", "vehicle", "single_cav_list", "vehicle_base")
    RSU = ("rsu", "rsu", "rsu_list", "rsu_base")

    def __init__(self, prefix: str, node_type: str, list_key: str, base_key: str):
        self.prefix = prefix
        self.node_type = node_type
        self.list_key = list_key
        self.base_key = base_key


@dataclass(frozen=True)
class AgentConfig:
    kind: AgentKind
    path: ConfigPath
    # The agent entry as written in the scenario.
    source: Mapping[str, Any]
    # The entry merged over agent_base and its base, as the fork sees it.
    config: Mapping[str, Any]


@dataclass(frozen=True)
class EffectiveConfig:
    root: Mapping[str, Any]
    agents: tuple[AgentConfig, ...]

    def agents_of(self, kind: AgentKind) -> Iterator[AgentConfig]:
        return (agent for agent in self.agents if agent.kind is kind)


class InvalidConfigError(Exception):
    """The fork would fail to load the config before any rule applies."""

    def __init__(self, issues: list[ConfigIssue]):
        super().__init__("; ".join(issue.message for issue in issues))
        self.issues = issues


def _merge(
    base: Any, override: Any, path: ConfigPath, conflicts: list[ConfigPath]
) -> Any:
    """Merge like OmegaConf.merge: mappings key by key, anything else replaced.

    OmegaConf refuses to merge a mapping with a list; those paths go to
    ``conflicts`` and the base value is kept.
    """
    if isinstance(base, Mapping) and isinstance(override, Mapping):
        merged = dict(base)
        for key, value in override.items():
            merged[key] = (
                _merge(base[key], value, (*path, key), conflicts)
                if key in base
                else value
            )
        return merged
    if (isinstance(base, Mapping) and isinstance(override, list)) or (
        isinstance(base, list) and isinstance(override, Mapping)
    ):
        conflicts.append(path)
        return base
    return override


def _check_conflicts(conflicts: list[ConfigPath]) -> None:
    if conflicts:
        raise InvalidConfigError(
            [
                error(
                    "config.merge",
                    "Cannot merge a mapping with a list; use the same type as "
                    "in default.yaml.",
                    path,
                )
                for path in conflicts
            ]
        )


def _resolve(config: Mapping[str, Any]) -> dict[str, Any]:
    """Resolve ``${...}`` interpolations as OmegaConf does when the fork reads them."""
    try:
        resolved = OmegaConf.to_container(OmegaConf.create(dict(config)), resolve=True)
    except OmegaConfBaseException as exc:
        full_key = str(getattr(exc, "full_key", "") or "")
        path = tuple(
            name or int(index) for name, index in _FULL_KEY_PART.findall(full_key)
        )
        raise InvalidConfigError(
            [error("config.invalid", str(exc).splitlines()[0], path)]
        ) from exc
    return resolved  # type: ignore[return-value]


def _mapping(value: Any, path: ConfigPath, name: str) -> Mapping[str, Any]:
    if value is None:
        return {}
    if not isinstance(value, Mapping):
        raise InvalidConfigError(
            [error("config.type", f"{name} must be a mapping.", path)]
        )
    return value


def _section(root: Mapping[str, Any], key: str) -> Mapping[str, Any]:
    return _mapping(root.get(key), (key,), key)


def _agents(
    root: Mapping[str, Any], kind: AgentKind, conflicts: list[ConfigPath]
) -> list[AgentConfig]:
    entries = _section(root, "scenario").get(kind.list_key)
    if entries is None:
        return []
    list_path: ConfigPath = ("scenario", kind.list_key)
    if not isinstance(entries, list):
        raise InvalidConfigError(
            [error("config.type", f"{kind.list_key} must be a list.", list_path)]
        )

    # The fork also merges {"platoon": platoon_base} into every CAV. Only
    # platoons read it and PlatoonRule rejects them, so it is left out here.
    base = _merge(
        _section(root, "agent_base"),
        _section(root, kind.base_key),
        (kind.base_key,),
        conflicts,
    )
    agents = []
    for index, entry in enumerate(entries):
        path = (*list_path, index)
        source = _mapping(entry, path, f"{kind.list_key}[{index}]")
        config = _merge(base, source, path, conflicts)
        agents.append(AgentConfig(kind, path, source, config))
    return agents


def build_effective_config(
    scenario: Any, defaults: Mapping[str, Any]
) -> EffectiveConfig:
    """Merge ``scenario`` the way the fork does.

    Raises ``InvalidConfigError`` when the fork could not even load it.
    """
    conflicts: list[ConfigPath] = []
    root = _merge(defaults, _mapping(scenario, (), "The config"), (), conflicts)
    _check_conflicts(conflicts)
    root = _resolve(root)
    agents = tuple(
        agent for kind in AgentKind for agent in _agents(root, kind, conflicts)
    )
    _check_conflicts(conflicts)
    return EffectiveConfig(root=root, agents=agents)
