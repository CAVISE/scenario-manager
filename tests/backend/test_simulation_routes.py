import json
import sqlite3
from pathlib import Path

from fastapi.testclient import TestClient

from simulation.app.app import app
from simulation.app.routers import scenario as scenario_router


def _scenario_payload():
  return {
    "scenario_id": None,
    "scenario_name": "Test Scenario",
    "weather": "ClearNoon",
    "scenario": [
      {
        "vehicle": "car",
        "color": {"r": 0, "g": 255, "b": 0},
        "active": True,
        "path": [{"x": 1, "y": 2, "z": 0}, {"x": 3, "y": 4, "z": 0}],
      }
    ],
  }


def test_create_and_get_scenario(tmp_path, monkeypatch):
  monkeypatch.chdir(tmp_path)
  Path("scenarios").mkdir()
  client = TestClient(app)

  create_response = client.post("/scenario/create", json=_scenario_payload())
  assert create_response.status_code == 200
  created_id = create_response.json()["scenario_id"]

  get_response = client.get(f"/scenario/{created_id}")
  assert get_response.status_code == 200
  assert get_response.json()["scenario_name"] == "Test Scenario"


def test_edit_scenario_overwrites_existing_file(tmp_path, monkeypatch):
  monkeypatch.chdir(tmp_path)
  scenarios_dir = Path("scenarios")
  scenarios_dir.mkdir()
  scenario_id = "abc123"
  existing = _scenario_payload()
  existing["scenario_id"] = scenario_id
  json.dump(existing, open(scenarios_dir / f"{scenario_id}.json", "w"))

  updated = _scenario_payload()
  updated["scenario_id"] = scenario_id
  updated["scenario_name"] = "Updated"
  client = TestClient(app)

  response = client.post("/scenario/edit", json=updated)
  assert response.status_code == 200

  stored = json.load(open(scenarios_dir / f"{scenario_id}.json"))
  assert stored["scenario_name"] == "Updated"


def test_reports_get_all_reads_from_config_db(tmp_path, monkeypatch):
  db_path = tmp_path / "db.db"
  conn = sqlite3.connect(db_path)
  conn.execute(
    "CREATE TABLE reports (id INTEGER PRIMARY KEY, scenario_id TEXT, scenario_name TEXT, status BOOLEAN)"
  )
  conn.execute("INSERT INTO reports (scenario_id, scenario_name, status) VALUES ('s1', 'Scenario', 'false')")
  conn.commit()
  conn.close()

  monkeypatch.setattr("simulation.app.core.config.config.SQLDB_NAME", str(db_path))
  client = TestClient(app)

  response = client.get("/reports/get/all")
  assert response.status_code == 200
  assert len(response.json()) == 1


def test_run_scenario_schedules_background_task(tmp_path, monkeypatch):
  monkeypatch.chdir(tmp_path)
  Path("scenarios").mkdir()
  scenario_id = "run123"
  payload = _scenario_payload()
  payload["scenario_id"] = scenario_id
  json.dump(payload, open(Path("scenarios") / f"{scenario_id}.json", "w"))

  db_path = tmp_path / "db.db"
  conn = sqlite3.connect(db_path)
  conn.execute(
    "CREATE TABLE reports (id INTEGER PRIMARY KEY, scenario_id TEXT, scenario_name TEXT, status BOOLEAN)"
  )
  conn.commit()
  conn.close()
  monkeypatch.setattr("simulation.app.core.config.config.SQLDB_NAME", str(db_path))

  calls = []
  monkeypatch.setattr(
    scenario_router.work,
    "do_scenario",
    lambda *args, **kwargs: calls.append((args, kwargs)),
  )

  client = TestClient(app)
  response = client.get(f"/scenario/run/{scenario_id}")
  assert response.status_code == 200
  assert len(calls) == 1
