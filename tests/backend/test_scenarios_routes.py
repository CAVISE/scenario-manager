import json

from sqlalchemy import func, select

from app.models import Scenario


def add_scenario(db_session, **overrides) -> Scenario:
    values = {
        "scenario_id": "sc-1",
        "name_of_scenario": "Scenario One",
        "scenario_text": json.dumps({"key": "val"}),
        "preview": "preview",
        "annotation": "note",
        "file_": "<OpenDRIVE></OpenDRIVE>",
    }
    values.update(overrides)
    scenario = Scenario(**values)
    db_session.add(scenario)
    db_session.commit()
    return scenario


def test_load_all_scenarios_returns_list(scenario_client, db_session):
    add_scenario(db_session, name_of_scenario="My Scenario")
    response = scenario_client.get("/api/load_all_scenarios")

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["count"] == 1
    assert data["scenarios"][0]["scenario_id"] == "sc-1"
    assert data["scenarios"][0]["name"] == "My Scenario"


def test_load_all_scenarios_empty(scenario_client):
    response = scenario_client.get("/api/load_all_scenarios")
    assert response.status_code == 200
    assert response.json()["count"] == 0


def test_load_scenario_returns_detail(scenario_client, db_session):
    add_scenario(db_session)
    response = scenario_client.get("/api/load_scenario/sc-1")

    assert response.status_code == 200
    data = response.json()
    assert data["scenario"]["scenario_id"] == "sc-1"
    assert data["scenario"]["scenario_text"] == {"key": "val"}


def test_load_scenario_404_when_missing(scenario_client):
    response = scenario_client.get("/api/load_scenario/missing")
    assert response.status_code == 404
    assert response.json()["detail"] == "Scenario not found"


def test_load_scenario_handles_invalid_json_text(scenario_client, db_session):
    add_scenario(db_session, scenario_id="sc-2", scenario_text="not-valid-json")
    response = scenario_client.get("/api/load_scenario/sc-2")

    assert response.status_code == 200
    assert response.json()["scenario"]["scenario_text"] == "not-valid-json"


def test_upload_scenario_success(scenario_client, db_session):
    response = scenario_client.post(
        "/api/upload_scenario",
        json={"name_of_scenario": "New Scenario", "scenario_id": "sc-new"},
    )

    assert response.status_code == 200
    assert response.json()["status"] == "success"
    assert (
        db_session.scalar(
            select(Scenario.name_of_scenario).where(Scenario.scenario_id == "sc-new")
        )
        == "New Scenario"
    )


def test_upload_scenario_409_when_id_exists(scenario_client, db_session):
    add_scenario(db_session, scenario_id="sc-existing")
    response = scenario_client.post(
        "/api/upload_scenario",
        json={"name_of_scenario": "Dupe", "scenario_id": "sc-existing"},
    )

    assert response.status_code == 409
    assert "already exists" in response.json()["detail"]
    assert db_session.scalar(select(func.count()).select_from(Scenario)) == 1


def test_upload_scenario_requires_name(scenario_client):
    response = scenario_client.post(
        "/api/upload_scenario", json={"scenario_id": "sc-1"}
    )
    assert response.status_code == 422


def test_upload_scenario_accepts_scenario_array(scenario_client, db_session):
    scenario = [{"vehicle": "car", "path": [{"x": 0, "y": 0, "z": 0}]}]
    response = scenario_client.post(
        "/api/upload_scenario",
        json={
            "name_of_scenario": "Array Scenario",
            "scenario_id": "sc-array",
            "scenario": scenario,
        },
    )

    assert response.status_code == 200
    stored = db_session.scalar(
        select(Scenario.scenario_text).where(Scenario.scenario_id == "sc-array")
    )
    assert json.loads(stored) == {"scenario_text": scenario}


def test_update_scenario_success(scenario_client, db_session):
    add_scenario(db_session)
    response = scenario_client.post(
        "/api/update_scenario",
        json={"scenario_id": "sc-1", "scenario_name": "Updated Name"},
    )

    assert response.status_code == 200
    assert response.json()["scenario_id"] == "sc-1"
    db_session.expire_all()
    assert (
        db_session.scalar(
            select(Scenario.name_of_scenario).where(Scenario.scenario_id == "sc-1")
        )
        == "Updated Name"
    )


def test_update_scenario_updates_opendrive(scenario_client, db_session):
    add_scenario(db_session)
    file_content = "<OpenDRIVE><road name='updated'/></OpenDRIVE>"
    response = scenario_client.post(
        "/api/update_scenario",
        json={"scenario_id": "sc-1", "file_": file_content},
    )

    assert response.status_code == 200
    db_session.expire_all()
    assert (
        db_session.scalar(select(Scenario.file_).where(Scenario.scenario_id == "sc-1"))
        == file_content
    )


def test_update_scenario_404_when_missing(scenario_client):
    response = scenario_client.post(
        "/api/update_scenario",
        json={"scenario_id": "missing", "scenario_name": "Name"},
    )
    assert response.status_code == 404


def test_delete_scenario_success(scenario_client, db_session):
    add_scenario(db_session)
    response = scenario_client.post(
        "/api/delete_scenario", json={"scenario_id": "sc-1"}
    )

    assert response.status_code == 200
    assert response.json()["status"] == "success"
    assert db_session.scalar(select(func.count()).select_from(Scenario)) == 0


def test_delete_scenario_404_when_missing(scenario_client):
    response = scenario_client.post(
        "/api/delete_scenario", json={"scenario_id": "missing"}
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Scenario not found"
