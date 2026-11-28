from collections.abc import Iterator, Mapping
from typing import Any

from app.integrations.opencda.fork.catalog import ServiceSpec
from app.integrations.opencda.fork.effective import AgentConfig, EffectiveConfig
from app.integrations.opencda.fork.issues import (
    ConfigIssue,
    ConfigPath,
    error,
    warning,
)
from app.integrations.opencda.fork.rules.base import origin

_SERVICES = ("behavior_services",)


class BehaviorServiceRule:
    """behavior_services of every agent after inheritance.

    The fork creates each service as ``service_class(**params)``, so an
    unknown type or parameter stops the run once the simulators are already up.
    """

    def __init__(self, services: Mapping[str, ServiceSpec]):
        self._services = services

    def check(self, config: EffectiveConfig) -> Iterator[ConfigIssue]:
        for agent in config.agents:
            yield from self._agent(config, agent)

    def _agent(
        self, config: EffectiveConfig, agent: AgentConfig
    ) -> Iterator[ConfigIssue]:
        services = agent.config.get("behavior_services")
        if services is None:
            return
        if not isinstance(services, Mapping):
            yield error(
                "behavior_services.type",
                "behavior_services must be a mapping of service type to parameters.",
                origin(config, agent, _SERVICES),
            )
            return

        for name, params in services.items():
            keys = (*_SERVICES, name)
            spec = self._services.get(name)
            if spec is None:
                yield error(
                    "behavior_services.unknown",
                    f"Unknown behavior service '{name}'.",
                    origin(config, agent, keys),
                )
            elif not isinstance(params, Mapping):
                yield error(
                    "behavior_services.params",
                    f"Parameters of '{name}' must be a mapping. An inherited "
                    "service cannot be removed with null.",
                    origin(config, agent, keys),
                )
            else:
                for param in params:
                    if param not in spec.params:
                        yield self._unknown_param(
                            spec, param, origin(config, agent, (*keys, param))
                        )
                for missing in self._missing_dependencies(spec, params, services):
                    yield error(
                        "behavior_services.requires",
                        f"'{name}' requires '{missing}' on the same agent.",
                        origin(config, agent, keys),
                    )

    @staticmethod
    def _unknown_param(spec: ServiceSpec, param: str, path: ConfigPath) -> ConfigIssue:
        if spec.ignores_unknown_params:
            return warning(
                "behavior_services.param_ignored",
                f"'{spec.name}' ignores parameter '{param}'.",
                path,
            )
        return error(
            "behavior_services.param_unknown",
            f"'{spec.name}' has no parameter '{param}'.",
            path,
        )

    @staticmethod
    def _missing_dependencies(
        spec: ServiceSpec, params: Mapping[str, Any], services: Mapping[str, Any]
    ) -> list[str]:
        required = set(spec.requires)
        for param, extra in spec.requires_unless.items():
            if params.get(param) is None:
                required |= extra
        return sorted(required - services.keys())
