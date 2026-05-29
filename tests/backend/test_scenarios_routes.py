import json
import pytest
from unittest.mock import MagicMock, patch, call
from fastapi.testclient import TestClient


def make_conn(rows=None, one=None, rowcount=1):
    cursor = MagicMock()
    cursor.fetchall.return_value = rows or []
    cursor.fetchone.return_value = one
    cursor.rowcount = rowcount
    cursor.__enter__ = lambda s: s
    cursor.__exit__ = MagicMock(return_value=False)

    conn = MagicMock()
    conn.cursor.return_value = cursor
    conn.__enter__ = lambda s: s
    conn.__exit__ = MagicMock(return_value=False)
    return conn, cursor


@pytest.fixture
def client():
    from main import app
    return TestClient(app)

def test_load_all_scenarios_returns_list(client):
    rows = [(1, "sc-1", "My Scenario", "preview_data", "note")]
    conn, _ = make_conn(rows=rows)

    with patch("app.routers.scenarios.get_conn", return_value=conn):
        response = client.get("/api/load_all_scenarios")

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["count"] == 1
    assert data["scenarios"][0]["scenario_id"] == "sc-1"
    assert data["scenarios"][0]["name"] == "My Scenario"


def test_load_all_scenarios_empty(client):
    conn, _ = make_conn(rows=[])

    with patch("app.routers.scenarios.get_conn", return_value=conn):
        response = client.get("/api/load_all_scenarios")

    assert response.status_code == 200
    assert response.json()["count"] == 0

def test_load_scenario_returns_detail(client):
    row = (1, "sc-1", "Scenario One", json.dumps({"key": "val"}), "preview", "note", "file.xodr")
    conn, _ = make_conn(one=row)

    with patch("app.routers.scenarios.get_conn", return_value=conn):
        response = client.get("/api/load_scenario/sc-1")

    assert response.status_code == 200
    data = response.json()
    assert data["scenario"]["scenario_id"] == "sc-1"
    assert data["scenario"]["scenario_text"] == {"key": "val"}


def test_load_scenario_404_when_missing(client):
    conn, _ = make_conn(one=None)

    with patch("app.routers.scenarios.get_conn", return_value=conn):
        response = client.get("/api/load_scenario/missing")

    assert response.status_code == 404
    assert response.json()["detail"] == "Scenario not found"


def test_load_scenario_handles_invalid_json_text(client):
    row = (1, "sc-2", "Scenario Two", "not-valid-json", None, None, None)
    conn, _ = make_conn(one=row)

    with patch("app.routers.scenarios.get_conn", return_value=conn):
        response = client.get("/api/load_scenario/sc-2")

    assert response.status_code == 200
    assert response.json()["scenario"]["scenario_text"] == "not-valid-json"

def test_upload_scenario_success(client):
    conn, cursor = make_conn(one=None)

    with patch("app.routers.scenarios.get_conn", return_value=conn):
        response = client.post("/api/upload_scenario", json={
            "name_of_scenario": "New Scenario",
            "scenario_id": "sc-new",
        })

    assert response.status_code == 200
    assert response.json()["status"] == "success"


def test_upload_scenario_409_when_id_exists(client):
    conn, cursor = make_conn(one=(1,))
    with patch("app.routers.scenarios.get_conn", return_value=conn):
        response = client.post("/api/upload_scenario", json={
            "name_of_scenario": "Dupe",
            "scenario_id": "sc-existing",
        })

    assert response.status_code == 409
    assert "already exists" in response.json()["detail"]


def test_upload_scenario_requires_name(client):
    response = client.post("/api/upload_scenario", json={"scenario_id": "sc-1"})
    assert response.status_code == 422

def test_update_scenario_success(client):
    conn, cursor = make_conn(one=("sc-1",))

    with patch("app.routers.scenarios.get_conn", return_value=conn):
        response = client.post("/api/update_scenario", json={
            "scenario_id": "sc-1",
            "scenario_name": "Updated Name",
        })

    assert response.status_code == 200
    assert response.json()["scenario_id"] == "sc-1"


def test_update_scenario_404_when_missing(client):
    conn, cursor = make_conn(one=None)

    with patch("app.routers.scenarios.get_conn", return_value=conn):
        response = client.post("/api/update_scenario", json={
            "scenario_id": "missing",
            "scenario_name": "Name",
        })

    assert response.status_code == 404

def test_delete_scenario_success(client):
    conn, cursor = make_conn(rowcount=1)

    with patch("app.routers.scenarios.get_conn", return_value=conn):
        response = client.post("/api/delete_scenario", json={"scenario_id": "sc-1"})

    assert response.status_code == 200
    assert response.json()["status"] == "success"


def test_delete_scenario_404_when_missing(client):
    conn, cursor = make_conn(rowcount=0)

    with patch("app.routers.scenarios.get_conn", return_value=conn):
        response = client.post("/api/delete_scenario", json={"scenario_id": "missing"})

    assert response.status_code == 404
    assert response.json()["detail"] == "Scenario not found"