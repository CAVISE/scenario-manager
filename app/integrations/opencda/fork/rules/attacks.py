from collections.abc import Iterator, Mapping

from app.integrations.opencda.fork.catalog import AttackSpec
from app.integrations.opencda.fork.effective import EffectiveConfig
from app.integrations.opencda.fork.issues import ConfigIssue, error
from app.integrations.opencda.fork.rules.base import services_of


class AttackRule:
    """The fork takes attacks only by name from its catalog."""

    def __init__(self, attacks: Mapping[str, AttackSpec]):
        self._attacks = attacks

    def check(self, config: EffectiveConfig) -> Iterator[ConfigIssue]:
        attacks = config.root.get("attacks")
        if attacks is None:
            return
        if not isinstance(attacks, list):
            yield error(
                "attacks.type", "attacks must be a list of names.", ("attacks",)
            )
            return

        for index, name in enumerate(attacks):
            path = ("attacks", index)
            if not isinstance(name, str):
                yield error(
                    "attacks.inline",
                    "Attacks defined in the scenario are not supported; use an "
                    "attack name from the fork catalog.",
                    path,
                )
                continue
            spec = self._attacks.get(name)
            if spec is None:
                yield error("attacks.unknown", f"Unknown attack '{name}'.", path)
                continue
            for requirement in spec.requires:
                if not any(
                    agent.kind.node_type == requirement.node_type
                    and requirement.service in services_of(agent)
                    for agent in config.agents
                ):
                    yield error(
                        "attacks.requires",
                        f"'{name}' needs a {requirement.node_type} with "
                        f"'{requirement.service}'.",
                        path,
                    )
