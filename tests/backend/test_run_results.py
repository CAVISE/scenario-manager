import json
import sys
import types
from unittest.mock import MagicMock

import pytest

from app.routers import simulation
from app.run_results import MANIFEST_NAME, read_run_metadata


@pytest.fixture(autouse=True)
def result_environment(monkeypatch, tmp_path):
    settings = types.SimpleNamespace(eval_dir=tmp_path, eval_retention_days=7)
    monkeypatch.setattr(simulation, "get_settings", lambda: settings)
    monkeypatch.setattr("app.run_results.get_settings", lambda: settings)
    monkeypatch.setattr(
        simulation,
        "simulation_state",
        {
            "running": False,
            "status": "idle",
            "error": None,
            "map": None,
            "run_id": None,
            "tick": 0,
            "max_ticks": 0,
            "partial": False,
        },
    )
    monkeypatch.setattr(simulation, "_broadcast_state", MagicMock())


def create_run(root, name, outcome=None):
    directory = root / name
    directory.mkdir()
    (directory / "plot.png").write_bytes(b"plot")
    if outcome is not None:
        (directory / MANIFEST_NAME).write_text(
            json.dumps(
                {
                    "outcome": outcome,
                    "tick": 25,
                    "max_ticks": 100,
                    "scenario_name": "Crossroad",
                    "scenario_id": "city-1",
                }
            )
        )
    return directory


def test_history_lists_complete_partial_and_legacy_runs(scenario_client, tmp_path):
    for outcome in ("complete", "partial", "running", "failed"):
        create_run(tmp_path, outcome, outcome)
    create_run(tmp_path, "legacy")
    response = scenario_client.get("/api/results")
    assert response.status_code == 200
    runs = {run["run_id"]: run for run in response.json()}
    assert set(runs) == {"complete", "partial", "legacy"}
    assert runs["partial"]["files_count"] == 1
    assert runs["partial"]["tick"] == 25
    assert runs["partial"]["scenario_id"] == "city-1"


@pytest.mark.parametrize("outcome", ["running", "failed"])
def test_unfinished_results_are_not_served(scenario_client, tmp_path, outcome):
    create_run(tmp_path, "run", outcome)
    assert scenario_client.get("/api/results/run").status_code == 404


def test_running_results_cannot_be_read_or_deleted(scenario_client, tmp_path):
    directory = create_run(tmp_path, "active", "partial")
    simulation.simulation_state.update(running=True, run_id="active")
    assert scenario_client.get("/api/results").json() == []
    assert scenario_client.get("/api/results/active").status_code == 409
    assert scenario_client.delete("/api/results/active").status_code == 409
    assert directory.exists()


def test_results_encode_special_characters_in_file_urls(scenario_client, tmp_path):
    directory = create_run(tmp_path, "run", "complete")
    (directory / "vehicle #1.png").write_bytes(b"plot")
    response = scenario_client.get("/api/results/run")
    files = {file["filename"]: file["url"] for file in response.json()["files"]}
    assert files["vehicle #1.png"] == "/evaluation_outputs/run/vehicle%20%231.png"
    assert MANIFEST_NAME not in files


def test_result_symlinks_cannot_escape_the_results_directory(scenario_client, tmp_path):
    outside = tmp_path.parent / "outside-result"
    outside.mkdir()
    (outside / "plot.png").write_bytes(b"keep")
    try:
        (tmp_path / "linked").symlink_to(outside, target_is_directory=True)
    except OSError:
        pytest.skip("Directory symlinks are unavailable")
    assert scenario_client.get("/api/results").json() == []
    assert scenario_client.get("/api/results/linked").status_code == 400
    assert scenario_client.delete("/api/results/linked").status_code == 400
    assert (outside / "plot.png").read_bytes() == b"keep"


@pytest.mark.parametrize("partial", [False, True])
def test_completed_run_persists_its_outcome_and_progress(
    monkeypatch, tmp_path, partial
):
    import app

    def run_scenario(_scenario, params):
        params["on_progress"](25, 100)
        return {"tick": 30, "max_ticks": 100, "partial": partial}

    runner = types.ModuleType("app.runner")
    runner.run_scenario = run_scenario
    monkeypatch.setitem(sys.modules, "app.runner", runner)
    monkeypatch.setattr(app, "runner", runner, raising=False)
    simulation.simulation_state.update(
        running=True, status="running", run_id="Town01_test"
    )
    simulation._run_with_state(
        {"scenario_id": "city-1", "scenario_name": "Crossroad"},
        {
            "map_name": "Town01",
            "current_time": "test",
            "max_ticks": 100,
        },
    )
    metadata = read_run_metadata(tmp_path / "Town01_test")
    assert metadata == {
        "outcome": "partial" if partial else "complete",
        "tick": 30,
        "max_ticks": 100,
        "scenario_id": "city-1",
        "scenario_name": "Crossroad",
    }
    assert simulation.simulation_state["status"] == "finished"
    assert simulation.simulation_state["running"] is False


def test_failed_run_retains_failure_metadata_and_error_status(monkeypatch, tmp_path):
    import app

    runner = types.ModuleType("app.runner")
    runner.run_scenario = MagicMock(side_effect=RuntimeError("CARLA crashed"))
    monkeypatch.setitem(sys.modules, "app.runner", runner)
    monkeypatch.setattr(app, "runner", runner, raising=False)
    simulation.simulation_state.update(
        running=True, status="running", run_id="Town01_test"
    )
    simulation._run_with_state(
        {}, {"map_name": "Town01", "current_time": "test", "max_ticks": 100}
    )
    assert read_run_metadata(tmp_path / "Town01_test")["outcome"] == "failed"
    assert simulation.simulation_state["status"] == "error"
    assert simulation.simulation_state["error"] == "CARLA crashed"
    assert simulation.simulation_state["running"] is False
