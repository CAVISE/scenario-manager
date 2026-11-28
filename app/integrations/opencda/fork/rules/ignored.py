from collections.abc import Iterator, Mapping

from app.integrations.opencda.fork.effective import AgentKind, EffectiveConfig
from app.integrations.opencda.fork.issues import ConfigIssue, ConfigPath, warning
from app.integrations.opencda.fork.rules.base import has_key, split_key

_AGENT_BASES = ("agent_base", *(kind.base_key for kind in AgentKind))


class IgnoredKeyRule:
    """Keys the fork never reads, so the setting has no effect."""

    def __init__(self, root_keys: Mapping[str, str], agent_keys: Mapping[str, str]):
        self._root_keys = root_keys
        self._agent_keys = agent_keys

    def check(self, config: EffectiveConfig) -> Iterator[ConfigIssue]:
        yield from self._find(config.root, (), self._root_keys)
        for base in _AGENT_BASES:
            yield from self._find(config.root.get(base), (base,), self._agent_keys)
        for agent in config.agents:
            yield from self._find(agent.source, agent.path, self._agent_keys)

    @staticmethod
    def _find(
        section: object, path: ConfigPath, keys: Mapping[str, str]
    ) -> Iterator[ConfigIssue]:
        for dotted, reason in keys.items():
            key = split_key(dotted)
            if has_key(section, key):
                yield warning(
                    "config.ignored",
                    f"The fork does not read {dotted}: {reason}.",
                    (*path, *key),
                )
