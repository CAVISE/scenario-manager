from collections.abc import Iterator, Mapping

from app.integrations.opencda.fork.effective import EffectiveConfig
from app.integrations.opencda.fork.issues import ConfigIssue, error
from app.integrations.opencda.fork.rules.base import is_number


class BlueprintRule:
    """Vehicle classes for background traffic, read when use_multi_class_bp is on."""

    def __init__(self, meta_files: Mapping[str, frozenset[str]]):
        self._meta_files = meta_files

    def check(self, config: EffectiveConfig) -> Iterator[ConfigIssue]:
        blueprint = config.root.get("blueprint")
        # The fork only tests the flag's truthiness.
        if not isinstance(blueprint, Mapping) or not blueprint.get(
            "use_multi_class_bp"
        ):
            return
        path = ("blueprint",)

        meta_path = blueprint.get("bp_meta_path")
        classes = (
            self._meta_files.get(meta_path) if isinstance(meta_path, str) else None
        )
        if classes is None:
            yield error(
                "blueprint.bp_meta_path",
                "bp_meta_path must be one of: "
                + ", ".join(sorted(self._meta_files))
                + ".",
                (*path, "bp_meta_path"),
            )

        weights = blueprint.get("bp_class_sample_prob")
        if weights is None:
            yield error(
                "blueprint.bp_class_sample_prob",
                "bp_class_sample_prob is required when use_multi_class_bp is true.",
                (*path, "bp_class_sample_prob"),
            )
        if not isinstance(weights, Mapping):
            return
        for name in weights:
            if classes is not None and name not in classes:
                yield error(
                    "blueprint.class",
                    f"Unknown vehicle class '{name}'; available: "
                    + ", ".join(sorted(classes))
                    + ".",
                    (*path, "bp_class_sample_prob", name),
                )
        if sum(value for value in weights.values() if is_number(value)) <= 0:
            yield error(
                "blueprint.bp_class_sample_prob",
                "bp_class_sample_prob must have a positive total.",
                (*path, "bp_class_sample_prob"),
            )
