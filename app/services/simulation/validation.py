from collections.abc import Mapping
from functools import cache
from typing import Any

from app.integrations.opencda.fork.validator import (
    ForkConfigValidator,
    create_fork_validator,
)
from app.schemas import ScenarioValidationIssue

# Fork issues point inside the YAML sent in this request field.
_FORK_ISSUE_ROOT = "opencda_config_yaml"


@cache
def _fork_validator() -> ForkConfigValidator:
    return create_fork_validator()


def fork_config_issues(config: Mapping[str, Any]) -> list[ScenarioValidationIssue]:
    """Check an OpenCDA config against the rules of the CAVISE/OpenCDA fork."""
    return [
        ScenarioValidationIssue(
            code=issue.code,
            message=issue.message,
            path=[_FORK_ISSUE_ROOT, *issue.path],
            severity=issue.severity.value,
        )
        for issue in _fork_validator().validate(config)
    ]


def preflight_entity_issues(body: dict[str, Any]) -> list[ScenarioValidationIssue]:
    """Return domain-level validation errors not expressed by the request schema."""
    groups = body.get("scenario")
    if not isinstance(groups, list):
        return []

    issues: list[ScenarioValidationIssue] = []
    has_rsu = False
    for group_index, group in enumerate(groups):
        if not isinstance(group, dict):
            continue
        vehicle_type = group.get("vehicle")
        has_rsu = has_rsu or vehicle_type == "RSU"
        if vehicle_type != "car" or not isinstance(group.get("path"), list):
            continue
        for item_index, item in enumerate(group["path"]):
            if not isinstance(item, dict):
                continue
            points = item.get("points")
            if isinstance(points, list) and points:
                continue
            entity_id = item.get("id")
            issues.append(
                ScenarioValidationIssue(
                    code="route.required",
                    message="Vehicle needs at least one route point before simulation.",
                    path=["scenario", group_index, "path", item_index, "points"],
                    entity_id=entity_id if isinstance(entity_id, str) else None,
                )
            )
    if groups and not has_rsu:
        issues.append(
            ScenarioValidationIssue(
                code="rsu.missing",
                message="No roadside unit is configured; V2X coverage cannot be evaluated.",
                severity="warning",
            )
        )
    return issues
