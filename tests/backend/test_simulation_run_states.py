import pytest

from app.services.simulation.contracts import (
    RunStatus,
    can_transition_run_status,
)


@pytest.mark.parametrize(
    ("current", "target"),
    [
        (RunStatus.QUEUED, RunStatus.RUNNING),
        (RunStatus.QUEUED, RunStatus.CANCELLED),
        (RunStatus.RUNNING, RunStatus.STOPPING),
        (RunStatus.RUNNING, RunStatus.COMPLETE),
        (RunStatus.STOPPING, RunStatus.PARTIAL),
    ],
)
def test_run_state_machine_allows_expected_transitions(current, target):
    assert can_transition_run_status(current, target)


@pytest.mark.parametrize(
    ("current", "target"),
    [
        (RunStatus.QUEUED, RunStatus.COMPLETE),
        (RunStatus.RUNNING, RunStatus.QUEUED),
        (RunStatus.COMPLETE, RunStatus.RUNNING),
        (RunStatus.CANCELLED, RunStatus.FAILED),
        ("invalid", RunStatus.FAILED),
    ],
)
def test_run_state_machine_rejects_invalid_transitions(current, target):
    assert not can_transition_run_status(current, target)
