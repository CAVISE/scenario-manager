import json

from sqlalchemy import func, select

from app.models import Scenario
from app.scenario_validation import extract_scenario_groups


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


def test_upload_scenario_generates_id_when_omitted(scenario_client, db_session):
    # The frontend no longer lets a user type a scenario_id at all (see
    # ScenarioControlWidget) -- the only way a new scenario gets an id
    # is the server generating one, which is what happens when the
    # caller doesn't supply one.
    response = scenario_client.post(
        "/api/upload_scenario", json={"name_of_scenario": "No Id Given"}
    )

    assert response.status_code == 200
    body = response.json()
    generated_id = body.get("scenario_id")
    assert generated_id
    assert (
        db_session.scalar(
            select(Scenario.name_of_scenario).where(
                Scenario.scenario_id == generated_id
            )
        )
        == "No Id Given"
    )


def test_upload_scenario_generated_ids_are_unique(scenario_client, db_session):
    ids = set()
    for _ in range(5):
        response = scenario_client.post(
            "/api/upload_scenario", json={"name_of_scenario": "Batch"}
        )
        assert response.status_code == 200
        ids.add(response.json()["scenario_id"])
    assert len(ids) == 5


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


def test_upload_scenario_stores_map(scenario_client, db_session):
    response = scenario_client.post(
        "/api/upload_scenario",
        json={
            "name_of_scenario": "Mapped Scenario",
            "scenario_id": "sc-mapped",
            "map": "Town05",
        },
    )

    assert response.status_code == 200
    assert (
        db_session.scalar(
            select(Scenario.map).where(Scenario.scenario_id == "sc-mapped")
        )
        == "Town05"
    )


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


_A_CAR_ON_TOWN03 = {
    "scenario_text": [
        {
            "vehicle": "car",
            "path": [{"x": 10.0, "y": 20.0, "z": 0.3}],
        }
    ]
}


def test_update_scenario_sets_map_on_empty_scenario_with_no_prior_map(
    scenario_client, db_session
):
    # Nothing to conflict with: no stored map, and no existing content
    # (default scenario_text is {"key": "val"}, which has no "vehicle"
    # groups) -- this is establishing the map for the first time.
    add_scenario(db_session, scenario_text=json.dumps({}))
    response = scenario_client.post(
        "/api/update_scenario",
        json={"scenario_id": "sc-1", "map": "Town01"},
    )

    assert response.status_code == 200
    db_session.expire_all()
    assert (
        db_session.scalar(select(Scenario.map).where(Scenario.scenario_id == "sc-1"))
        == "Town01"
    )


def test_update_scenario_409_when_map_change_empties_scene(
    scenario_client, db_session
):
    # The original bug this guards against: an existing scenario still
    # carrying placed cars/RSUs is saved under a different map with an
    # empty scene attached (as when the CARLA-tab map dropdown is used
    # directly, which never clears the scene, and the stale cars ride
    # along -- or, the other direction, the scene genuinely was cleared
    # by the map picker but the still-old scenario_id is reused). No
    # map_change_confirmed flag can bypass this -- it isn't read at all.
    add_scenario(db_session, map="Town03", scenario_text=json.dumps(_A_CAR_ON_TOWN03))
    response = scenario_client.post(
        "/api/update_scenario",
        json={
            "scenario_id": "sc-1",
            "map": "Town01",
            "scenario": {"scenario_text": []},
            "map_change_confirmed": True,  # must NOT bypass the check
        },
    )

    assert response.status_code == 409
    assert "explicit_clear" in response.json()["detail"]
    db_session.expire_all()
    assert (
        db_session.scalar(select(Scenario.map).where(Scenario.scenario_id == "sc-1"))
        == "Town03"
    )


def test_update_scenario_409_wipes_scene_even_without_map_change(
    scenario_client, db_session
):
    # The broader gap: emptying an existing scenario's scene is blocked
    # regardless of whether the map is involved at all -- a save that
    # only meant to rename the scenario but accidentally carried an
    # empty scenario field must not silently erase existing cars/RSUs.
    add_scenario(db_session, map="Town03", scenario_text=json.dumps(_A_CAR_ON_TOWN03))
    response = scenario_client.post(
        "/api/update_scenario",
        json={
            "scenario_id": "sc-1",
            "scenario_name": "Renamed",
            "scenario": {"scenario_text": []},
        },
    )

    assert response.status_code == 409
    db_session.expire_all()
    row_text = db_session.scalar(
        select(Scenario.scenario_text).where(Scenario.scenario_id == "sc-1")
    )
    assert json.loads(row_text) == _A_CAR_ON_TOWN03


def test_update_scenario_explicit_clear_allows_wipe(scenario_client, db_session):
    add_scenario(db_session, map="Town03", scenario_text=json.dumps(_A_CAR_ON_TOWN03))
    response = scenario_client.post(
        "/api/update_scenario",
        json={
            "scenario_id": "sc-1",
            "scenario": {"scenario_text": []},
            "explicit_clear": True,
        },
    )

    assert response.status_code == 200
    db_session.expire_all()
    row_text = db_session.scalar(
        select(Scenario.scenario_text).where(Scenario.scenario_id == "sc-1")
    )
    assert extract_scenario_groups(json.loads(row_text)) in ([], [{}])
    assert not any(
        g.get("path") for g in extract_scenario_groups(json.loads(row_text))
    )


def test_update_scenario_explicit_clear_allows_map_change_too(
    scenario_client, db_session
):
    add_scenario(db_session, map="Town03", scenario_text=json.dumps(_A_CAR_ON_TOWN03))
    response = scenario_client.post(
        "/api/update_scenario",
        json={
            "scenario_id": "sc-1",
            "map": "Town01",
            "scenario": {"scenario_text": []},
            "explicit_clear": True,
        },
    )

    assert response.status_code == 200
    db_session.expire_all()
    assert (
        db_session.scalar(select(Scenario.map).where(Scenario.scenario_id == "sc-1"))
        == "Town01"
    )


def test_update_scenario_409_even_when_stored_map_was_unset(
    scenario_client, db_session
):
    # A legacy row with map=None (pre-migration, or never given one)
    # still has real content, and emptying it is not treated as a free
    # pass just because map was never recorded.
    add_scenario(db_session, map=None, scenario_text=json.dumps(_A_CAR_ON_TOWN03))
    response = scenario_client.post(
        "/api/update_scenario",
        json={
            "scenario_id": "sc-1",
            "map": "Town01",
            "scenario": {"scenario_text": []},
        },
    )

    assert response.status_code == 409


def test_update_scenario_allows_map_change_with_new_content_present(
    scenario_client, db_session
):
    # Placing new (non-empty) content under a different map is not a
    # wipe -- it's not blocked, only flagged via the response's warning
    # field so the caller can double-check the positions.
    add_scenario(db_session, map="Town03", scenario_text=json.dumps(_A_CAR_ON_TOWN03))
    new_content = {
        "scenario_text": [
            {"vehicle": "car", "path": [{"x": 1.0, "y": 2.0, "z": 0.0}]}
        ]
    }
    response = scenario_client.post(
        "/api/update_scenario",
        json={"scenario_id": "sc-1", "map": "Town01", "scenario": new_content},
    )

    assert response.status_code == 200
    body = response.json()
    assert body.get("warning")
    assert "Town03" in body["warning"]
    assert "Town01" in body["warning"]
    db_session.expire_all()
    assert (
        db_session.scalar(select(Scenario.map).where(Scenario.scenario_id == "sc-1"))
        == "Town01"
    )


def test_update_scenario_allows_map_change_when_no_scenario_field_sent(
    scenario_client, db_session
):
    # A caller that changes the map but doesn't send a scenario field
    # at all (body.scenario is None) is not asserting any car/RSU
    # positions for this call -- extract_scenario_groups(None) is [],
    # and the wipe guard only triggers when body.scenario is explicitly
    # provided (`is not None`), so a call that never touches the scene
    # at all isn't blocked for content it never sent.
    add_scenario(db_session, map="Town03", scenario_text=json.dumps(_A_CAR_ON_TOWN03))
    response = scenario_client.post(
        "/api/update_scenario",
        json={"scenario_id": "sc-1", "map": "Town01"},
    )

    assert response.status_code == 200


def test_update_scenario_same_map_not_blocked(scenario_client, db_session):
    add_scenario(db_session, map="Town01", scenario_text=json.dumps(_A_CAR_ON_TOWN03))
    response = scenario_client.post(
        "/api/update_scenario",
        json={
            "scenario_id": "sc-1",
            "map": "Town01",
            "scenario": _A_CAR_ON_TOWN03,
            "scenario_name": "Renamed",
        },
    )

    assert response.status_code == 200
    assert not response.json().get("warning")


def test_update_scenario_without_map_field_skips_check(scenario_client, db_session):
    # A caller that doesn't send map at all isn't asserting anything
    # about the map this call -- must not be blocked (or warned) even
    # though the stored map is set and the scenario has content, as
    # long as it isn't emptying the scene.
    add_scenario(db_session, map="Town03", scenario_text=json.dumps(_A_CAR_ON_TOWN03))
    response = scenario_client.post(
        "/api/update_scenario",
        json={"scenario_id": "sc-1", "annotation": "just a note update"},
    )

    assert response.status_code == 200
    assert not response.json().get("warning")


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
