import json
from datetime import datetime
from uuid import uuid4

import pytest
from sqlalchemy import func, select

from app.models import Scenario, ScenarioVersion


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

    content = values.pop("scenario_text")
    if content is not None:
        try:
            content = json.loads(content)
        except json.JSONDecodeError:
            pass

    version = ScenarioVersion(
        number=values.pop("revision", 1),
        content=content,
        preview=values.pop("preview"),
        map=values.pop("map", None),
        file_=values.pop("file_"),
    )
    scenario = Scenario(**values)
    db_session.add(scenario)
    db_session.flush()

    version.scenario_id = scenario.id
    db_session.add(version)
    db_session.commit()
    return scenario


def test_list_scenarios_returns_paginated_list(scenario_client, db_session):
    add_scenario(db_session, name_of_scenario="My Scenario")
    response = scenario_client.get("/api/v1/scenarios")

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["scenario_id"] == "sc-1"
    assert data["items"][0]["name"] == "My Scenario"


def test_list_scenarios_empty(scenario_client):
    response = scenario_client.get("/api/v1/scenarios")
    assert response.status_code == 200
    assert response.json()["total"] == 0


def test_scenario_reads_use_latest_version(scenario_client, db_session):
    scenario = add_scenario(db_session, map="Town03")
    first_version_id = db_session.execute(
        select(ScenarioVersion.id).where(ScenarioVersion.scenario_id == scenario.id)
    ).scalar_one()
    content = {"scenario_text": []}
    file_content = "<OpenDRIVE><road name='latest'/></OpenDRIVE>"
    db_session.add(
        ScenarioVersion(
            scenario_id=scenario.id,
            number=2,
            previous_version_id=first_version_id,
            content=content,
            preview="latest-preview",
            map="Town05",
            file_=file_content,
        )
    )
    db_session.commit()
    add_scenario(db_session, scenario_id="sc-2", revision=3, preview="other-preview")

    response = scenario_client.get("/api/v1/scenarios/sc-1")

    assert response.status_code == 200
    data = response.json()
    assert data["scenario_id"] == "sc-1"
    assert data["name_of_scenario"] == "Scenario One"
    assert data["annotation"] == "note"
    assert data["scenario_text"] == content
    assert data["revision"] == 2
    assert data["preview"] == "latest-preview"
    assert data["map"] == "Town05"
    assert data["file_"] == file_content

    response = scenario_client.get("/api/v1/scenarios")
    assert response.status_code == 200
    assert {
        item["scenario_id"]: item["preview"] for item in response.json()["items"]
    } == {"sc-1": "latest-preview", "sc-2": "other-preview"}


def test_get_scenario_404_when_missing(scenario_client):
    response = scenario_client.get("/api/v1/scenarios/missing")
    assert response.status_code == 404
    assert response.json()["detail"] == "Scenario not found"


def test_get_scenario_handles_invalid_json_text(scenario_client, db_session):
    add_scenario(db_session, scenario_id="sc-2", scenario_text="not-valid-json")
    response = scenario_client.get("/api/v1/scenarios/sc-2")

    assert response.status_code == 200
    assert response.json()["scenario_text"] == "not-valid-json"


def test_list_scenario_versions_paginates_newest_first(scenario_client, db_session):
    add_scenario(db_session, revision=7)
    add_scenario(db_session, scenario_id="other", revision=9)
    url = "/api/v1/scenarios/sc-1"
    saved = scenario_client.patch(
        url, json={"scenario_id": "sc-1", "expected_revision": 7, "preview": "new"}
    )
    assert saved.status_code == 200

    response = scenario_client.get(f"{url}/versions", params={"limit": 1})
    assert response.status_code == 200
    page = response.json()
    assert (page["total"], page["latest_revision"], page["offset"], page["limit"]) == (
        2,
        8,
        0,
        1,
    )
    (newest,) = page["items"]
    assert newest["number"] == 8
    assert "content" not in newest
    assert "file_" not in newest

    response = scenario_client.get(f"{url}/versions", params={"limit": 1, "offset": 1})
    assert response.status_code == 200
    (older,) = response.json()["items"]
    assert older["number"] == 7
    assert newest["previous_version_id"] == older["id"]


def test_get_scenario_version_returns_saved_snapshot_and_latest_revision(
    scenario_client, db_session
):
    content = {"scenario_text": []}
    add_scenario(
        db_session, revision=3, map="Town03", scenario_text=json.dumps(content)
    )
    add_scenario(db_session, scenario_id="other", revision=8)
    url = "/api/v1/scenarios/sc-1"
    saved = scenario_client.patch(
        url, json={"scenario_id": "sc-1", "expected_revision": 3, "map": "Town05"}
    )
    assert saved.status_code == 200

    response = scenario_client.get(f"{url}/versions/3")
    assert response.status_code == 200
    version = response.json()
    assert version["number"] == 3
    assert version["latest_revision"] == 4
    assert version["content"] == content
    assert version["map"] == "Town03"
    assert version["file_"] == "<OpenDRIVE></OpenDRIVE>"
    assert version["preview"] == "preview"
    assert scenario_client.get(f"{url}/versions/8").status_code == 404
    assert scenario_client.get("/api/v1/scenarios/missing/versions").status_code == 404


def test_create_scenario_success(scenario_client, db_session):
    response = scenario_client.post(
        "/api/v1/scenarios",
        json={"name_of_scenario": "New Scenario", "scenario_id": "sc-new"},
    )

    assert response.status_code == 201
    assert response.json()["status"] == "success"
    assert response.json()["revision"] == 1
    assert (
        db_session.scalar(
            select(Scenario.name_of_scenario).where(Scenario.scenario_id == "sc-new")
        )
        == "New Scenario"
    )


def test_create_scenario_409_when_id_exists(scenario_client, db_session):
    add_scenario(db_session, scenario_id="sc-existing")
    response = scenario_client.post(
        "/api/v1/scenarios",
        json={"name_of_scenario": "Dupe", "scenario_id": "sc-existing"},
    )

    assert response.status_code == 409
    assert "already exists" in response.json()["detail"]
    assert db_session.scalar(select(func.count()).select_from(Scenario)) == 1


@pytest.mark.parametrize(
    ("value", "error"),
    [
        ("bad\x00text", "null character"),
        ("\ud800", "invalid Unicode"),
        (float("inf"), "numbers must be finite"),
    ],
)
def test_create_scenario_rejects_values_jsonb_cannot_store(
    scenario_client, db_session, value, error
):
    response = scenario_client.post(
        "/api/v1/scenarios",
        content=json.dumps(
            {
                "name_of_scenario": "Invalid content",
                "scenario": {"scenario_text": [], "metadata": [{"field": value}]},
            }
        ),
        headers={"Content-Type": "application/json"},
    )

    assert response.status_code == 422
    assert error in response.json()["detail"]
    assert db_session.scalar(select(func.count()).select_from(Scenario)) == 0


def test_create_scenario_requires_name(scenario_client):
    response = scenario_client.post("/api/v1/scenarios", json={"scenario_id": "sc-1"})
    assert response.status_code == 422


def test_create_scenario_generates_id_when_omitted(scenario_client, db_session):
    # The frontend no longer lets a user type a scenario_id at all (see
    # ScenarioControlWidget) -- the only way a new scenario gets an id
    # is the server generating one, which is what happens when the
    # caller doesn't supply one.
    response = scenario_client.post(
        "/api/v1/scenarios", json={"name_of_scenario": "No Id Given"}
    )

    assert response.status_code == 201
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


def test_create_scenario_generated_ids_are_unique(scenario_client, db_session):
    ids = set()
    for _ in range(5):
        response = scenario_client.post(
            "/api/v1/scenarios", json={"name_of_scenario": "Batch"}
        )
        assert response.status_code == 201
        ids.add(response.json()["scenario_id"])
    assert len(ids) == 5


def test_create_scenario_accepts_scenario_array(scenario_client, db_session):
    scenario = [{"vehicle": "car", "path": [{"x": 0, "y": 0, "z": 0}]}]
    opendrive = "<OpenDRIVE></OpenDRIVE>"
    preview = "data:image/png;base64,AA=="
    response = scenario_client.post(
        "/api/v1/scenarios",
        json={
            "name_of_scenario": "Array Scenario",
            "scenario_id": "sc-array",
            "scenario": scenario,
            "map": "Town05",
            "file_": opendrive,
            "preview": preview,
        },
    )

    assert response.status_code == 201
    stored = db_session.scalars(
        select(Scenario).where(Scenario.scenario_id == "sc-array")
    ).one()
    expected = {"scenario_text": scenario}
    assert stored.owner_id is None

    version = db_session.scalars(
        select(ScenarioVersion).where(ScenarioVersion.scenario_id == stored.id)
    ).one()
    assert version.number == response.json()["revision"] == 1
    assert version.content == expected
    assert version.author_id is None
    assert version.previous_version_id is None
    assert version.map == "Town05"
    assert version.file_ == opendrive
    assert version.preview == preview


def test_create_scenario_stores_map(scenario_client):
    response = scenario_client.post(
        "/api/v1/scenarios",
        json={
            "name_of_scenario": "Mapped Scenario",
            "scenario_id": "sc-mapped",
            "map": "Town05",
        },
    )

    assert response.status_code == 201
    assert scenario_client.get("/api/v1/scenarios/sc-mapped").json()["map"] == "Town05"


def test_update_scenario_success(scenario_client, db_session):
    add_scenario(db_session)
    response = scenario_client.patch(
        "/api/v1/scenarios/sc-1",
        json={"scenario_id": "sc-1", "scenario_name": "Updated Name"},
    )

    assert response.status_code == 200
    assert response.json()["scenario_id"] == "sc-1"
    assert response.json()["revision"] == 2
    db_session.expire_all()
    assert (
        db_session.scalar(
            select(Scenario.name_of_scenario).where(Scenario.scenario_id == "sc-1")
        )
        == "Updated Name"
    )


def test_update_scenario_rejects_invalid_jsonb_without_adding_version(
    scenario_client, db_session
):
    scenario = add_scenario(db_session, scenario_text="{}")
    response = scenario_client.patch(
        "/api/v1/scenarios/sc-1",
        json={
            "scenario_id": "sc-1",
            "expected_revision": 1,
            "scenario": {"scenario_text": [], "bad\x00key": "value"},
        },
    )

    assert response.status_code == 422
    assert "null character" in response.json()["detail"]
    assert db_session.scalars(
        select(ScenarioVersion.number).where(ScenarioVersion.scenario_id == scenario.id)
    ).all() == [1]


def test_update_scenario_rejects_stale_revision(scenario_client, db_session):
    add_scenario(db_session)
    first_update = scenario_client.patch(
        "/api/v1/scenarios/sc-1",
        json={
            "scenario_id": "sc-1",
            "scenario_name": "First update",
            "expected_revision": 1,
        },
    )
    assert first_update.status_code == 200

    response = scenario_client.patch(
        "/api/v1/scenarios/sc-1",
        json={
            "scenario_id": "sc-1",
            "scenario_name": "Stale update",
            "expected_revision": 1,
        },
    )

    assert response.status_code == 409
    assert "changed in another session" in response.json()["detail"]


def test_restore_scenario_appends_copy_of_selected_version(scenario_client, db_session):
    content = {"scenario_text": []}
    scenario = add_scenario(
        db_session,
        revision=3,
        scenario_text=json.dumps(content),
        map="Town03",
        preview="old-preview",
    )
    head = ScenarioVersion(
        scenario_id=scenario.id,
        number=8,
        content={
            "scenario_text": [{"vehicle": "car", "path": [{"x": 1, "y": 2, "z": 3}]}]
        },
        map="Town05",
        file_="<OpenDRIVE><road name='new'/></OpenDRIVE>",
        preview="new-preview",
    )
    db_session.add(head)
    db_session.commit()

    url = "/api/v1/scenarios/sc-1"
    response = scenario_client.patch(
        url,
        json={
            "scenario_id": "sc-1",
            "expected_revision": 8,
            "source_version_number": 3,
        },
    )
    assert response.status_code == 200
    assert response.json()["revision"] == 9

    original = scenario_client.get(f"{url}/versions/3").json()
    restored = scenario_client.get(f"{url}/versions/9").json()
    assert restored["id"] == response.json()["version_id"]
    assert restored["previous_version_id"] == head.id
    assert original["content"] == restored["content"] == content
    assert original["map"] == restored["map"] == "Town03"
    assert original["file_"] == restored["file_"] == "<OpenDRIVE></OpenDRIVE>"
    assert original["preview"] == restored["preview"] == "old-preview"
    assert scenario_client.get(f"{url}/versions/8").json()["preview"] == "new-preview"


def test_restore_scenario_validates_source_and_expected_revision(
    scenario_client, db_session
):
    add_scenario(db_session)
    add_scenario(db_session, scenario_id="other", revision=3)
    url = "/api/v1/scenarios/sc-1"
    restore = {"scenario_id": "sc-1", "source_version_number": 3}

    assert scenario_client.patch(url, json=restore).status_code == 422
    response = scenario_client.patch(url, json={**restore, "expected_revision": 1})
    assert response.status_code == 404
    assert scenario_client.get(f"{url}/versions").json()["total"] == 1


def test_retry_returns_original_saved_version_after_later_save(
    scenario_client, db_session
):
    add_scenario(db_session)
    url = "/api/v1/scenarios/sc-1"
    headers = {"Idempotency-Key": str(uuid4())}
    body = {"scenario_id": "sc-1", "expected_revision": 1, "preview": "updated"}

    first = scenario_client.patch(url, json=body, headers=headers)
    assert first.status_code == 200
    assert first.json()["revision"] == 2
    later = scenario_client.patch(
        url, json={**body, "expected_revision": 2, "preview": "later"}
    )
    assert later.status_code == 200
    assert later.json()["revision"] == 3

    replay = scenario_client.patch(url, json=body, headers=headers)
    assert replay.status_code == 200
    assert replay.json() == first.json()

    reused = scenario_client.patch(url, json={**body, "preview": None}, headers=headers)
    assert reused.status_code == 409
    assert reused.json()["detail"] == "Idempotency-Key was used for another save"
    versions = scenario_client.get(f"{url}/versions").json()
    assert [version["number"] for version in versions["items"]] == [3, 2, 1]


def test_update_scenario_updates_opendrive(scenario_client, db_session):
    add_scenario(db_session)
    file_content = "<OpenDRIVE><road name='updated'/></OpenDRIVE>"
    response = scenario_client.patch(
        "/api/v1/scenarios/sc-1",
        json={"scenario_id": "sc-1", "file_": file_content},
    )

    assert response.status_code == 200
    assert scenario_client.get("/api/v1/scenarios/sc-1").json()["file_"] == file_content


def test_update_scenario_can_clear_preview(scenario_client, db_session):
    old_preview = "data:image/png;base64,old-preview"
    old_updated_at = datetime(2020, 1, 1)
    scenario = add_scenario(
        db_session, map="Town05", preview=old_preview, updated_at=old_updated_at
    )
    response = scenario_client.patch(
        "/api/v1/scenarios/sc-1",
        json={"scenario_id": "sc-1", "preview": None},
    )

    assert response.status_code == 200
    assert response.json()["revision"] == 2
    db_session.expire_all()
    assert scenario.updated_at > old_updated_at
    first, second = db_session.scalars(
        select(ScenarioVersion)
        .where(ScenarioVersion.scenario_id == scenario.id)
        .order_by(ScenarioVersion.number)
    ).all()
    assert (first.number, second.number) == (1, 2)
    assert second.previous_version_id == first.id
    assert first.preview == old_preview
    assert second.preview is None
    assert second.content == first.content == {"key": "val"}
    assert second.map == first.map == "Town05"
    assert second.file_ == first.file_ == "<OpenDRIVE></OpenDRIVE>"


def test_update_scenario_404_when_missing(scenario_client):
    response = scenario_client.patch(
        "/api/v1/scenarios/missing",
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
    response = scenario_client.patch(
        "/api/v1/scenarios/sc-1",
        json={"scenario_id": "sc-1", "map": "Town01"},
    )

    assert response.status_code == 200
    assert scenario_client.get("/api/v1/scenarios/sc-1").json()["map"] == "Town01"


def test_update_scenario_409_when_map_change_empties_scene(scenario_client, db_session):
    # The original bug this guards against: an existing scenario still
    # carrying placed cars/RSUs is saved under a different map with an
    # empty scene attached (as when the CARLA-tab map dropdown is used
    # directly, which never clears the scene, and the stale cars ride
    # along -- or, the other direction, the scene genuinely was cleared
    # by the map picker but the still-old scenario_id is reused). No
    # map_change_confirmed flag can bypass this -- it isn't read at all.
    add_scenario(db_session, map="Town03", scenario_text=json.dumps(_A_CAR_ON_TOWN03))
    response = scenario_client.patch(
        "/api/v1/scenarios/sc-1",
        json={
            "scenario_id": "sc-1",
            "map": "Town01",
            "scenario": {"scenario_text": []},
            "map_change_confirmed": True,  # must NOT bypass the check
        },
    )

    assert response.status_code == 409
    assert "explicit_clear" in response.json()["detail"]
    assert scenario_client.get("/api/v1/scenarios/sc-1").json()["map"] == "Town03"


def test_update_scenario_allows_map_change_when_scene_is_omitted(
    scenario_client, db_session
):
    add_scenario(db_session, map="Town03", scenario_text=json.dumps(_A_CAR_ON_TOWN03))
    response = scenario_client.patch(
        "/api/v1/scenarios/sc-1",
        json={"scenario_id": "sc-1", "map": "Town01"},
    )

    assert response.status_code == 200
    assert scenario_client.get("/api/v1/scenarios/sc-1").json()["map"] == "Town01"


def test_update_scenario_409_wipes_scene_even_without_map_change(
    scenario_client, db_session
):
    # The broader gap: emptying an existing scenario's scene is blocked
    # regardless of whether the map is involved at all -- a save that
    # only meant to rename the scenario but accidentally carried an
    # empty scenario field must not silently erase existing cars/RSUs.
    add_scenario(db_session, map="Town03", scenario_text=json.dumps(_A_CAR_ON_TOWN03))
    response = scenario_client.patch(
        "/api/v1/scenarios/sc-1",
        json={
            "scenario_id": "sc-1",
            "scenario_name": "Renamed",
            "scenario": {"scenario_text": []},
        },
    )

    assert response.status_code == 409
    assert (
        scenario_client.get("/api/v1/scenarios/sc-1").json()["scenario_text"]
        == _A_CAR_ON_TOWN03
    )


def test_update_scenario_explicit_clear_allows_wipe(scenario_client, db_session):
    add_scenario(db_session, map="Town03", scenario_text=json.dumps(_A_CAR_ON_TOWN03))
    response = scenario_client.patch(
        "/api/v1/scenarios/sc-1",
        json={
            "scenario_id": "sc-1",
            "scenario": {"scenario_text": []},
            "explicit_clear": True,
        },
    )

    assert response.status_code == 200
    assert scenario_client.get("/api/v1/scenarios/sc-1").json()["scenario_text"] == {
        "scenario_text": []
    }


def test_update_scenario_explicit_clear_allows_map_change_too(
    scenario_client, db_session
):
    add_scenario(db_session, map="Town03", scenario_text=json.dumps(_A_CAR_ON_TOWN03))
    response = scenario_client.patch(
        "/api/v1/scenarios/sc-1",
        json={
            "scenario_id": "sc-1",
            "map": "Town01",
            "scenario": {"scenario_text": []},
            "explicit_clear": True,
        },
    )

    assert response.status_code == 200
    assert scenario_client.get("/api/v1/scenarios/sc-1").json()["map"] == "Town01"


def test_update_scenario_409_even_when_stored_map_was_unset(
    scenario_client, db_session
):
    # A legacy row with map=None (pre-migration, or never given one)
    # still has real content, and emptying it is not treated as a free
    # pass just because map was never recorded.
    add_scenario(db_session, map=None, scenario_text=json.dumps(_A_CAR_ON_TOWN03))
    response = scenario_client.patch(
        "/api/v1/scenarios/sc-1",
        json={
            "scenario_id": "sc-1",
            "map": "Town01",
            "scenario": {"scenario_text": []},
        },
    )

    assert response.status_code == 409


def test_update_scenario_rejects_map_change_with_new_content_present(
    scenario_client, db_session
):
    # Coordinates are map-relative. Updating a saved scenario in place
    # would silently move its objects onto unrelated roads.
    add_scenario(db_session, map="Town03", scenario_text=json.dumps(_A_CAR_ON_TOWN03))
    new_content = {
        "scenario_text": [{"vehicle": "car", "path": [{"x": 1.0, "y": 2.0, "z": 0.0}]}]
    }
    response = scenario_client.patch(
        "/api/v1/scenarios/sc-1",
        json={"scenario_id": "sc-1", "map": "Town01", "scenario": new_content},
    )

    assert response.status_code == 409
    assert "cannot change maps" in response.json()["detail"]
    assert scenario_client.get("/api/v1/scenarios/sc-1").json()["map"] == "Town03"


def test_update_scenario_same_map_not_blocked(scenario_client, db_session):
    add_scenario(db_session, map="Town01", scenario_text=json.dumps(_A_CAR_ON_TOWN03))
    response = scenario_client.patch(
        "/api/v1/scenarios/sc-1",
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
    response = scenario_client.patch(
        "/api/v1/scenarios/sc-1",
        json={"scenario_id": "sc-1", "annotation": "just a note update"},
    )

    assert response.status_code == 200
    assert not response.json().get("warning")


def test_delete_scenario_archives_it_and_preserves_versions(
    scenario_client, db_session
):
    content = {"scenario_text": []}
    scenario = add_scenario(db_session, scenario_text=json.dumps(content))
    scenario_id = scenario.id
    url = "/api/v1/scenarios/sc-1"

    response = scenario_client.delete(url)

    assert response.status_code == 200
    assert response.json()["status"] == "success"
    db_session.expire_all()
    archived = db_session.get(Scenario, scenario_id)
    assert archived is not None
    assert archived.is_archived is True
    saved_version = db_session.scalars(
        select(ScenarioVersion).where(ScenarioVersion.scenario_id == scenario_id)
    ).one()
    assert saved_version.content == content

    page = scenario_client.get("/api/v1/scenarios").json()
    assert page["items"] == []
    assert page["total"] == 0
    assert scenario_client.get(url).status_code == 404
    assert scenario_client.get(f"{url}/versions").status_code == 404
    assert scenario_client.get(f"{url}/versions/1").status_code == 404
    assert scenario_client.patch(url, json={"scenario_id": "sc-1"}).status_code == 404
    assert scenario_client.delete(url).status_code == 404


def test_delete_scenario_404_when_missing(scenario_client):
    response = scenario_client.delete("/api/v1/scenarios/missing")
    assert response.status_code == 404
    assert response.json()["detail"] == "Scenario not found"
