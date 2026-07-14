import pytest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient


@pytest.fixture
def client():
    from main import app
    return TestClient(app)


@pytest.fixture(autouse=True)
def reset_simulation_state():
    from app.routers.simulation import simulation_state, _ws_clients
    simulation_state.update({
        "running": False,
        "status": "idle",
        "error": None,
        "map": None,
        "run_id": None,
    })
    _ws_clients.clear()
    yield

def test_status_returns_idle_by_default(client):
    response = client.get("/api/status")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "idle"
    assert data["running"] is False
    assert data["error"] is None

def test_stop_returns_400_when_not_running(client):
    response = client.post("/api/stop")
    assert response.status_code == 400
    assert response.json()["detail"] == "No simulation running"


def test_stop_returns_stopping_when_running(client):
    from app.routers.simulation import simulation_state
    simulation_state["running"] = True
    simulation_state["status"] = "running"

    import sys
    import types
    fake_runner = types.ModuleType("app.runner")
    fake_runner.request_stop = MagicMock()

    with patch.dict(sys.modules, {"app.runner": fake_runner}):
        response = client.post("/api/stop")

    assert response.status_code == 200
    assert response.json()["status"] == "stopping"
    assert simulation_state["status"] == "stopping"

VALID_SIM_SCENARIO = [
    {
        "vehicle": "car",
        "path": [
            {
                "x": 0,
                "y": 0,
                "z": 0,
                "points": [{"id": 0, "x": 10, "y": 0, "z": 0}],
            }
        ],
    }
]


def test_start_returns_409_when_already_running(client, open_cda_yaml):
    from app.routers.simulation import simulation_state
    simulation_state["running"] = True

    response = client.post("/api/start_opencda", json={
        "map": "Town01",
        "max_ticks": 100,
        "opencda_config_yaml": open_cda_yaml,
        "scenario": VALID_SIM_SCENARIO,
    })
    assert response.status_code == 409
    assert "already running" in response.json()["detail"]


def test_start_returns_started(client, open_cda_yaml):
    with patch("app.routers.simulation._executor") as mock_executor:
        mock_executor.submit = MagicMock()
        response = client.post("/api/start_opencda", json={
            "map": "Town01",
            "max_ticks": 100,
            "opencda_config_yaml": open_cda_yaml,
            "scenario": VALID_SIM_SCENARIO,
        })

    assert response.status_code == 200
    assert response.json()["status"] == "started"
    assert response.json()["map"] == "Town01"

def test_results_returns_400_on_path_traversal(client):
    response = client.get("/api/results/../etc")
    assert response.status_code in (400, 404)


def test_results_returns_404_when_not_found(client, tmp_path):
    with patch("app.routers.simulation.get_settings") as mock_settings:
        mock_settings.return_value.eval_dir = tmp_path
        response = client.get("/api/results/nonexistent_run")
    assert response.status_code == 404


def test_results_returns_artifact_files(client, tmp_path):
    run_id = "Town01_20250101"
    run_dir = tmp_path / run_id
    run_dir.mkdir()
    (run_dir / "result.png").write_bytes(b"fake")
    (run_dir / "log.txt").write_text("evaluation")
    (run_dir / "forensic.log").write_text("forensic")
    (run_dir / "source_config.yaml").write_text("world: {}")
    (run_dir / "config_overrides.json").write_text("{}")
    (run_dir / "other.csv").write_text("ignore")

    with patch("app.routers.simulation.get_settings") as mock_settings:
        mock_settings.return_value.eval_dir = tmp_path
        response = client.get(f"/api/results/{run_id}")

    assert response.status_code == 200
    data = response.json()
    assert data["run_id"] == run_id
    assert [item["filename"] for item in data["files"]] == [
        "config_overrides.json",
        "forensic.log",
        "log.txt",
        "result.png",
        "source_config.yaml",
    ]

def test_delete_results_404_when_not_found(client, tmp_path):
    with patch("app.routers.simulation.get_settings") as mock_settings:
        mock_settings.return_value.eval_dir = tmp_path
        response = client.delete("/api/results/nonexistent")
    assert response.status_code == 404


def test_delete_results_removes_directory(client, tmp_path):
    run_id = "Town01_20250101"
    run_dir = tmp_path / run_id
    run_dir.mkdir()

    with patch("app.routers.simulation.get_settings") as mock_settings:
        mock_settings.return_value.eval_dir = tmp_path
        response = client.delete(f"/api/results/{run_id}")

    assert response.status_code == 200
    assert not run_dir.exists()

def test_health_returns_ok(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
