from collections.abc import Mapping, Sequence
from typing import Any

from app.integrations.opencda.fork.catalog import ForkCatalog, default_fork_catalog
from app.integrations.opencda.fork.effective import (
    InvalidConfigError,
    build_effective_config,
)
from app.integrations.opencda.fork.issues import ConfigIssue
from app.integrations.opencda.fork.rules import (
    AgentIdRule,
    AgentPlacementRule,
    AttackRule,
    BehaviorServiceRule,
    ConfigRule,
    IgnoredKeyRule,
    LocalizationRule,
    MapManagerRule,
    PerceptionRule,
    PlatoonRule,
    TrafficManagerRule,
    WorldRule,
)


class ForkConfigValidator:
    """Checks a scenario config against the rules of the CAVISE/OpenCDA fork."""

    def __init__(self, defaults: Mapping[str, Any], rules: Sequence[ConfigRule]):
        self._defaults = defaults
        self._rules = tuple(rules)

    def validate(self, scenario: Mapping[str, Any]) -> list[ConfigIssue]:
        try:
            config = build_effective_config(scenario, self._defaults)
        except InvalidConfigError as exc:
            return exc.issues
        # A problem inherited from a base is found for every agent but has
        # the same origin path, so keep one copy.
        issues = (issue for rule in self._rules for issue in rule.check(config))
        return list(dict.fromkeys(issues))


def create_fork_validator(catalog: ForkCatalog | None = None) -> ForkConfigValidator:
    catalog = catalog or default_fork_catalog()
    return ForkConfigValidator(
        catalog.defaults,
        [
            WorldRule(),
            AgentIdRule(),
            AgentPlacementRule(),
            PlatoonRule(),
            PerceptionRule(),
            LocalizationRule(),
            MapManagerRule(),
            BehaviorServiceRule(catalog.services),
            AttackRule(catalog.attacks),
            TrafficManagerRule(),
            IgnoredKeyRule(catalog.ignored_root_keys, catalog.ignored_agent_keys),
        ],
    )
