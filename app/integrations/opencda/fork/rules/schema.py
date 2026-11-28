from collections.abc import Iterator
from typing import Any

from pydantic import ValidationError

from app.integrations.opencda.fork import schema
from app.integrations.opencda.fork.effective import AgentKind, EffectiveConfig
from app.integrations.opencda.fork.issues import (
    ConfigIssue,
    ConfigPath,
    error,
    warning,
)
from app.integrations.opencda.fork.rules.base import origin

_AGENT_MODELS: dict[AgentKind, type[schema.Section]] = {
    AgentKind.CAV: schema.Cav,
    AgentKind.RSU: schema.Rsu,
}


class SchemaRule:
    """Type and range of every field the fork reads (see fork/schema.py)."""

    def check(self, config: EffectiveConfig) -> Iterator[ConfigIssue]:
        for key, model in schema.ROOT_SECTIONS.items():
            section = config.root.get(key)
            # A null section is either optional or reported by another rule.
            if section is not None:
                for loc, kind, message in _errors(model, section):
                    yield _issue((key, *loc), kind, message)
        for agent in config.agents:
            for loc, kind, message in _errors(_AGENT_MODELS[agent.kind], agent.config):
                yield _issue(origin(config, agent, loc), kind, message)


def _errors(
    model: type[schema.Section], data: Any
) -> Iterator[tuple[ConfigPath, str, str]]:
    try:
        model.model_validate(data)
    except ValidationError as exc:
        for item in exc.errors():
            yield tuple(item["loc"]), item["type"], item["msg"]


def _issue(path: ConfigPath, kind: str, message: str) -> ConfigIssue:
    make = warning if kind == schema.TRUTHY_FLAG else error
    field = ".".join(map(str, path))
    return make("config.value", f"{field}: {message}.", path)
