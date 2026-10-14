from dataclasses import dataclass
from enum import StrEnum
from typing import Any


class RunStatus(StrEnum):
    """Persistent states of a simulation run.

    The database stores values rather than enum names so status remains easy to
    inspect operationally and compatible with existing records.
    """

    QUEUED = "queued"
    RUNNING = "running"
    STOPPING = "stopping"
    COMPLETE = "complete"
    PARTIAL = "partial"
    FAILED = "failed"
    CANCELLED = "cancelled"


TERMINAL_RUN_STATUSES = frozenset(
    {
        RunStatus.COMPLETE,
        RunStatus.PARTIAL,
        RunStatus.FAILED,
        RunStatus.CANCELLED,
    }
)

ALLOWED_RUN_TRANSITIONS: dict[RunStatus, frozenset[RunStatus]] = {
    RunStatus.QUEUED: frozenset(
        {RunStatus.RUNNING, RunStatus.FAILED, RunStatus.CANCELLED}
    ),
    RunStatus.RUNNING: frozenset(
        {
            RunStatus.STOPPING,
            RunStatus.COMPLETE,
            RunStatus.PARTIAL,
            RunStatus.FAILED,
        }
    ),
    RunStatus.STOPPING: frozenset(
        {RunStatus.COMPLETE, RunStatus.PARTIAL, RunStatus.FAILED}
    ),
    RunStatus.COMPLETE: frozenset(),
    RunStatus.PARTIAL: frozenset(),
    RunStatus.FAILED: frozenset(),
    RunStatus.CANCELLED: frozenset(),
}


def can_transition_run_status(current: str, target: str) -> bool:
    """Whether a persisted run may move from ``current`` to ``target``."""
    try:
        current_status = RunStatus(current)
        target_status = RunStatus(target)
    except ValueError:
        return False
    return (
        current_status == target_status
        or target_status in ALLOWED_RUN_TRANSITIONS[current_status]
    )


@dataclass(frozen=True)
class QueuedSimulation:
    run_id: str
    map_name: str
    scenario_raw: dict[str, Any]
    params: dict[str, Any]
