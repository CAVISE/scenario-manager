import math
from collections.abc import Iterator, Mapping
from typing import Any, Protocol

from app.integrations.opencda.fork.effective import AgentConfig, EffectiveConfig
from app.integrations.opencda.fork.issues import ConfigIssue, ConfigPath

_MISSING = object()


class ConfigRule(Protocol):
    def check(self, config: EffectiveConfig) -> Iterator[ConfigIssue]: ...


def is_number(value: Any) -> bool:
    return (
        isinstance(value, (int, float))
        and not isinstance(value, bool)
        and math.isfinite(value)
    )


def as_float(value: Any) -> float | None:
    """A number or numeric string, as the fork reads it with float()."""
    if isinstance(value, bool):
        return None
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    return number if math.isfinite(number) else None


def split_key(dotted: str) -> ConfigPath:
    return tuple(dotted.split("."))


def lookup(mapping: Any, keys: ConfigPath, default: Any = None) -> Any:
    value = mapping
    for key in keys:
        if isinstance(value, Mapping) and key in value:
            value = value[key]
        elif isinstance(value, list) and isinstance(key, int) and key < len(value):
            value = value[key]
        else:
            return default
    return value


def has_key(mapping: Any, keys: ConfigPath) -> bool:
    return lookup(mapping, keys, _MISSING) is not _MISSING


def origin(config: EffectiveConfig, agent: AgentConfig, keys: ConfigPath) -> ConfigPath:
    """Where the agent's value at ``keys`` is set: its entry, its base or agent_base.

    Issues point there, so a mistake in vehicle_base is reported once instead
    of once per vehicle.
    """
    if has_key(agent.source, keys):
        return (*agent.path, *keys)
    for base in (agent.kind.base_key, "agent_base"):
        if has_key(config.root.get(base), keys):
            return (base, *keys)
    return (*agent.path, *keys)


def services_of(agent: AgentConfig) -> Mapping[str, Any]:
    services = agent.config.get("behavior_services")
    return services if isinstance(services, Mapping) else {}
