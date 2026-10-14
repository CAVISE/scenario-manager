import json
from datetime import datetime, timezone

import pytest
from types import SimpleNamespace
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient


class _MemoryRunRepository:
    """Small durable-store double for HTTP contract tests.

    Scheduling is deliberately outside the API process now.  These tests only
    need to assert the state the API persists for the separate worker.
    """

    def __init__(self) -> None:
        self.records: dict[str, SimpleNamespace] = {}

    def save(self, run, status="queued") -> None:
        now = datetime.now(timezone.utc)
        self.records[run.run_id] = SimpleNamespace(
            run_id=run.run_id,
            status=str(status),
            map_name=run.map_name,
            scenario_id=run.scenario_raw.get("scenario_id"),
            scenario_name=run.scenario_raw.get("scenario_name"),
            scenario_raw=json.dumps(run.scenario_raw),
            params=json.dumps(run.params),
            error=None,
            created_at=now,
            updated_at=now,
        )

    def transition(self, run_id, status, error=None) -> bool:
        from app.services.simulation.contracts import can_transition_run_status

        record = self.records.get(run_id)
        if record is None or not can_transition_run_status(record.status, str(status)):
            return False
        record.status = str(status)
        record.error = error
        record.updated_at = datetime.now(timezone.utc)
        return True

    def get(self, run_id):
        return self.records.get(run_id)

    def list_all(self):
        return sorted(
            self.records.values(), key=lambda record: record.updated_at, reverse=True
        )

    def queue_position(self, run_id):
        queued = sorted(
            (record for record in self.records.values() if record.status == "queued"),
            key=lambda record: (record.created_at, record.run_id),
        )
        return next(
            (
                position
                for position, record in enumerate(queued, start=1)
                if record.run_id == run_id
            ),
            None,
        )


@pytest.fixture
def client():
    from main import app

    return TestClient(app)


@pytest.fixture(autouse=True)
def reset_simulation_state(monkeypatch, tmp_path):
    from app.routers.simulation import _notifier, simulation_state
    from app.routers import simulation

    settings = SimpleNamespace(eval_dir=tmp_path, xodr_dir=tmp_path / "xodrs")
    monkeypatch.setattr(simulation, "get_settings", lambda: settings)
    monkeypatch.setattr("app.run_results.get_settings", lambda: settings)
    repository = _MemoryRunRepository()
    monkeypatch.setattr(simulation, "_run_repository", repository)
    simulation_state.update(
        {
            "running": False,
            "status": "idle",
            "error": None,
            "map": None,
            "run_id": None,
            "tick": 0,
            "max_ticks": 0,
            "partial": False,
        }
    )
    _notifier.clear()
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

    response = client.post(
        "/api/start_opencda",
        json={
            "map": "Town01",
            "max_ticks": 100,
            "opencda_config_yaml": open_cda_yaml,
            "scenario": VALID_SIM_SCENARIO,
        },
    )
    assert response.status_code == 409
    assert "already running" in response.json()["detail"]


def test_start_queues_a_durable_run(client, open_cda_yaml):
    response = client.post(
        "/api/start_opencda",
        json={
            "map": "Town01",
            "max_ticks": 100,
            "opencda_config_yaml": open_cda_yaml,
            "scenario": VALID_SIM_SCENARIO,
        },
    )

    assert response.status_code == 200
    assert response.json()["status"] == "queued"
    assert response.json()["map"] == "Town01"
    assert response.json()["run_id"].startswith("Town01_")


def test_preflight_reports_structured_validation_issues(client, open_cda_yaml):
    response = client.post(
        "/api/v1/scenarios/validate",
        json={
            "map": "Town01",
            "opencda_config_yaml": open_cda_yaml,
            "scenario": [],
        },
    )

    assert response.status_code == 200
    assert response.json()["valid"] is False
    issue = response.json()["issues"][0]
    assert issue["code"]
    assert issue["message"]
    assert issue["path"] == ["scenario"]


def test_preflight_accepts_valid_run_payload(client, open_cda_yaml):
    response = client.post(
        "/api/v1/scenarios/validate",
        json={
            "map": "Town01",
            "opencda_config_yaml": open_cda_yaml,
            "scenario": VALID_SIM_SCENARIO,
        },
    )

    assert response.status_code == 200
    assert response.json() == {
        "valid": True,
        "issues": [
            {
                "code": "rsu.missing",
                "message": "No roadside unit is configured; V2X coverage cannot be evaluated.",
                "path": [],
                "severity": "warning",
                "entity_id": None,
            }
        ],
    }


def test_v1_run_exposes_stable_run_id_and_active_status(client, open_cda_yaml):
    response = client.post(
        "/api/v1/runs",
        json={
            "map": "Town01",
            "max_ticks": 100,
            "opencda_config_yaml": open_cda_yaml,
            "scenario": VALID_SIM_SCENARIO,
        },
    )

    assert response.status_code == 200
    run_id = response.json()["run_id"]
    status = client.get(f"/api/v1/runs/{run_id}")
    assert status.status_code == 200
    assert status.json()["run_id"] == run_id
    assert status.json()["status"] == "queued"
    assert status.json()["running"] is False


def test_v1_runs_queue_and_start_in_submission_order(client, open_cda_yaml, tmp_path):
    settings = SimpleNamespace(eval_dir=tmp_path, xodr_dir=tmp_path / "xodrs")
    payload = {
        "map": "Town01",
        "max_ticks": 100,
        "opencda_config_yaml": open_cda_yaml,
        "scenario": VALID_SIM_SCENARIO,
    }
    with (
        patch("app.routers.simulation.get_settings", return_value=settings),
        patch("app.run_results.get_settings", return_value=settings),
    ):
        first = client.post("/api/v1/runs", json=payload)
        second = client.post("/api/v1/runs", json=payload)

        assert first.json()["status"] == "queued"
        assert second.json()["status"] == "queued"
        assert (
            client.get(f"/api/v1/runs/{first.json()['run_id']}").json()[
                "queue_position"
            ]
            == 1
        )

        queued_status = client.get(f"/api/v1/runs/{second.json()['run_id']}")
        assert queued_status.status_code == 200
        assert queued_status.json()["status"] == "queued"
        assert queued_status.json()["running"] is False
        assert queued_status.json()["queue_position"] == 2


def test_v1_can_cancel_a_queued_run(client, open_cda_yaml, tmp_path):
    settings = SimpleNamespace(eval_dir=tmp_path, xodr_dir=tmp_path / "xodrs")
    payload = {
        "map": "Town01",
        "max_ticks": 100,
        "opencda_config_yaml": open_cda_yaml,
        "scenario": VALID_SIM_SCENARIO,
    }
    with (
        patch("app.routers.simulation.get_settings", return_value=settings),
        patch("app.run_results.get_settings", return_value=settings),
    ):
        client.post("/api/v1/runs", json=payload)
        queued = client.post("/api/v1/runs", json=payload).json()
        deletion = client.delete(f"/api/results/{queued['run_id']}")
        response = client.post(f"/api/v1/runs/{queued['run_id']}/cancel")

        assert deletion.status_code == 409
        assert response.status_code == 200
        assert response.json() == {"status": "cancelled", "run_id": queued["run_id"]}
        status = client.get(f"/api/v1/runs/{queued['run_id']}")
        assert status.json()["status"] == "cancelled"
        assert status.json()["queue_position"] is None


def test_v1_cancel_only_stops_the_active_run(client):
    from app.routers.simulation import simulation_state

    simulation_state.update(running=True, status="running", run_id="active")

    import sys
    import types

    fake_runner = types.ModuleType("app.runner")
    fake_runner.request_stop = MagicMock()

    with patch.dict(sys.modules, {"app.runner": fake_runner}):
        response = client.post("/api/v1/runs/not-active/cancel")
        accepted = client.post("/api/v1/runs/active/cancel")

    assert response.status_code == 409
    assert accepted.status_code == 200
    assert accepted.json() == {"status": "stopping", "run_id": "active"}


@pytest.mark.parametrize(
    "bad_map",
    [
        "../escaped_marker",
        "../../tmp/pwned",
        "/etc/passwd",
        "a/../../b",
        "..\\..\\windows",
    ],
)
def test_start_rejects_map_path_traversal(client, open_cda_yaml, bad_map):
    response = client.post(
        "/api/start_opencda",
        json={
            "map": bad_map,
            "max_ticks": 100,
            "opencda_config_yaml": open_cda_yaml,
            "scenario": VALID_SIM_SCENARIO,
        },
    )
    assert response.status_code == 422
    assert simulation_state_is_clean(client)


def simulation_state_is_clean(client):
    from app.routers.simulation import simulation_state

    return simulation_state["running"] is False


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
    with patch("main.database_is_ready", return_value=True):
        response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_start_accepts_custom_uploaded_map_name(client, open_cda_yaml):
    response = client.post(
        "/api/start_opencda",
        json={
            "map": "my_custom-map_01",
            "max_ticks": 100,
            "opencda_config_yaml": open_cda_yaml,
            "scenario": VALID_SIM_SCENARIO,
        },
    )
    assert response.status_code == 200
    assert response.json()["map"] == "my_custom-map_01"
