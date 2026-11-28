"""Build the config the fork actually runs with.

The fork merges the scenario over ``default.yaml`` and then builds every agent
from ``agent_base``, ``vehicle_base`` or ``rsu_base`` and the agent entry.
Rules check this merged result, so inherited values are taken into account.
"""

from collections.abc import Iterator, Mapping
from dataclasses import dataclass
from enum import Enum
from typing import Any

from omegaconf import DictConfig, ListConfig, OmegaConf
from omegaconf.errors import OmegaConfBaseException

from app.integrations.opencda.fork.issues import ConfigIssue, ConfigPath, error


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


def _merge_conflicts(
    base: Any, override: Any, path: ConfigPath
) -> Iterator[ConfigPath]:
    """Paths where OmegaConf refuses to merge a mapping with a list."""
    if isinstance(base, Mapping) and isinstance(override, Mapping):
        for key, value in override.items():
            if key in base:
                yield from _merge_conflicts(base[key], value, (*path, key))
    elif isinstance(base, Mapping) and isinstance(override, list):
        yield path
    elif isinstance(base, list) and isinstance(override, Mapping):
        yield path


def _merge(layers: list[tuple[Mapping[str, Any], ConfigPath]]) -> dict[str, Any]:
    """Merge layers in order, reporting every layer that OmegaConf would reject."""
    conflicts: list[ConfigIssue] = []
    try:
        merged: DictConfig | ListConfig = OmegaConf.create(dict(layers[0][0]))
        for override, path in layers[1:]:
            current = OmegaConf.to_container(merged, resolve=False)
            found = [
                error(
                    "config.merge",
                    "Cannot merge a mapping with a list; use the same type "
                    "as in default.yaml.",
                    conflict,
                )
                for conflict in _merge_conflicts(current, override, path)
            ]
            if found:
                conflicts.extend(found)
                continue
            merged = OmegaConf.merge(merged, override)
        if conflicts:
            raise InvalidConfigError(conflicts)
        return OmegaConf.to_container(merged, resolve=True)  # type: ignore[return-value]
    except OmegaConfBaseException as exc:
        full_key = str(getattr(exc, "full_key", "") or "")
        error_path: ConfigPath = tuple(full_key.split(".")) if full_key else ()
        raise InvalidConfigError(
            [error("config.invalid", str(exc).splitlines()[0], error_path)]
        ) from exc


def _mapping(value: Any, path: ConfigPath, name: str) -> Mapping[str, Any]:
    if value is None:
        return {}
    if not isinstance(value, Mapping):
        raise InvalidConfigError(
            [error("config.type", f"{name} must be a mapping.", path)]
        )
    return value


def _agents(root: Mapping[str, Any], kind: AgentKind) -> Iterator[AgentConfig]:
    scenario = _mapping(root.get("scenario"), ("scenario",), "scenario")
    entries = scenario.get(kind.list_key)
    if entries is None:
        return
    list_path: ConfigPath = ("scenario", kind.list_key)
    if not isinstance(entries, list):
        raise InvalidConfigError(
            [
                error(
                    "config.type",
                    f"scenario.{kind.list_key} must be a list.",
                    list_path,
                )
            ]
        )

    layers: list[tuple[Mapping[str, Any], ConfigPath]] = [
        (
            _mapping(root.get("agent_base"), ("agent_base",), "agent_base"),
            ("agent_base",),
        ),
        (
            _mapping(root.get(kind.base_key), (kind.base_key,), kind.base_key),
            (kind.base_key,),
        ),
    ]
    if kind is AgentKind.CAV:
        platoon_base = _mapping(
            root.get("platoon_base"), ("platoon_base",), "platoon_base"
        )
        layers.append(({"platoon": platoon_base}, ("platoon_base",)))

    for index, entry in enumerate(entries):
        path = (*list_path, index)
        source = _mapping(entry, path, f"scenario.{kind.list_key}[{index}]")
        yield AgentConfig(
            kind=kind,
            path=path,
            source=source,
            config=_merge([*layers, (source, path)]),
        )


def build_effective_config(
    scenario: Mapping[str, Any], defaults: Mapping[str, Any]
) -> EffectiveConfig:
    """Merge ``scenario`` the way the fork does.

    Raises ``InvalidConfigError`` when the fork could not even load it.
    """
    root = _merge([(defaults, ()), (scenario, ())])
    agents = (*_agents(root, AgentKind.CAV), *_agents(root, AgentKind.RSU))
    return EffectiveConfig(root=root, agents=agents)
