from collections.abc import Iterator, Mapping
from typing import Any

from app.integrations.opencda.fork.effective import AgentKind, EffectiveConfig
from app.integrations.opencda.fork.issues import (
    ConfigIssue,
    ConfigPath,
    error,
    warning,
)
from app.integrations.opencda.fork.rules.base import has_key, lookup, origin, split_key

_LEGACY_KEYS = ("enabled_metrics", "metric_params")


class MetricsRule:
    """metrics blocks, resolved as in opencda/metrics_tools of the fork.

    An unknown metric name is skipped with a warning by the fork, while an
    unknown parameter stops the run when the agent is created.
    """

    def __init__(
        self,
        metrics: Mapping[str, frozenset[str]],
        root_blocks: Mapping[str, frozenset[str]],
        cav_blocks: Mapping[str, frozenset[str]],
    ):
        self._metrics = metrics
        self._root_blocks = root_blocks
        self._cav_blocks = cav_blocks

    def check(self, config: EffectiveConfig) -> Iterator[ConfigIssue]:
        for dotted, useful in self._root_blocks.items():
            keys = split_key(dotted)
            if has_key(config.root, keys):
                yield from self._block(lookup(config.root, keys), keys, dotted, useful)
        for agent in config.agents_of(AgentKind.CAV):
            for dotted, useful in self._cav_blocks.items():
                keys = split_key(dotted)
                if has_key(agent.config, keys):
                    yield from self._block(
                        lookup(agent.config, keys),
                        origin(config, agent, keys),
                        dotted,
                        useful,
                    )

    def _block(
        self, block: Any, path: ConfigPath, dotted: str, useful: frozenset[str]
    ) -> Iterator[ConfigIssue]:
        if not isinstance(block, Mapping):
            yield error("metrics.type", f"{dotted} must be a mapping.", path)
            return
        for key in _LEGACY_KEYS:
            if key in block:
                yield error(
                    "metrics.legacy",
                    f"{key} is no longer supported; use metric_configs.",
                    (*path, key),
                )
        if "metric_configs" not in block:
            return
        configs = block["metric_configs"]
        configs_path = (*path, "metric_configs")
        if not isinstance(configs, Mapping):
            yield error(
                "metrics.type", "metric_configs must be a mapping.", configs_path
            )
            return

        for name, params in configs.items():
            metric_path = (*configs_path, name)
            if name not in self._metrics:
                yield warning(
                    "metrics.unknown",
                    f"Unknown metric '{name}'; the fork skips it.",
                    metric_path,
                )
                continue
            if not isinstance(params, Mapping):
                yield error(
                    "metrics.params",
                    f"Parameters of '{name}' must be a mapping.",
                    metric_path,
                )
                continue
            if name not in useful:
                yield warning(
                    "metrics.unused",
                    f"'{name}' records nothing in {dotted}.",
                    metric_path,
                )
            for param in params:
                if param not in self._metrics[name]:
                    yield error(
                        "metrics.param_unknown",
                        f"'{name}' has no parameter '{param}'.",
                        (*metric_path, param),
                    )
