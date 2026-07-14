import asyncio
from unittest.mock import MagicMock

from sqlalchemy import select

from app.models import Scenario


def test_upload_scenario_without_scenario_id(scenario_client, db_session):
    response = scenario_client.post("/api/upload_scenario", json={
        "name_of_scenario": "No ID Scenario",
    })

    assert response.status_code == 200
    assert response.json()["status"] == "success"
    assert db_session.scalar(select(Scenario.scenario_id)) is None

def test_update_scenario_with_none_fields(scenario_client, db_session):
    scenario = Scenario(
        scenario_id="sc-1",
        name_of_scenario="Original",
        preview="preview",
        annotation="annotation",
    )
    db_session.add(scenario)
    db_session.commit()

    response = scenario_client.post("/api/update_scenario", json={
        "scenario_id": "sc-1",
        "scenario_name": None,
        "preview": None,
        "annotation": None,
    })

    assert response.status_code == 200
    db_session.refresh(scenario)
    assert scenario.name_of_scenario == "Original"
    assert scenario.preview == "preview"
    assert scenario.annotation == "annotation"

def test_spawn_yaw_is_zero_when_coords_identical(open_cda_config_factory):
    from app.utils import yaml_to_runtime_scenario

    config = open_cda_config_factory()
    config["scenario"]["single_cav_list"][0]["spawn_position"] = [5, 5, 0, 0, 0, 0]
    config["scenario"]["single_cav_list"][0]["destination"] = [5, 5, 0]
    payload = {
        "map": "Town03",
        "scenario": [{
            "vehicle": "car",
            "path": [{
                "x": 5, "y": 5, "z": 0,
                "points": [{"x": 5, "y": 5, "z": 0}],
            }]
        }]
    }
    result, _, _ = yaml_to_runtime_scenario(config, payload)
    cav = result["scenario"]["single_cav_list"][0]
    assert cav["spawn_position"][4] == 0.0

def test_unknown_map_uses_zero_offset(open_cda_config_factory):
    from app.utils import yaml_to_runtime_scenario

    config = open_cda_config_factory()
    config["scenario"]["single_cav_list"][0]["spawn_position"] = [10, 20, 0, 0, 0, 0]
    payload = {
        "map": "UnknownMap",
        "scenario": [{
            "vehicle": "car",
            "path": [{"x": 10, "y": 20, "z": 0, "points": []}]
        }]
    }
    result, _, _ = yaml_to_runtime_scenario(config, payload)
    cav = result["scenario"]["single_cav_list"][0]
    assert cav["spawn_position"][0] == 10
    assert cav["spawn_position"][1] == -20 

def test_broadcast_state_skips_when_no_loop(caplog):
    import logging
    from app.routers import simulation as sim_module

    original_loop = sim_module._main_loop
    sim_module._main_loop = None

    try:
        with caplog.at_level(logging.WARNING, logger="app.routers.simulation"):
            sim_module._broadcast_state()
        assert "no event loop" in caplog.text
    finally:
        sim_module._main_loop = original_loop

def test_broadcast_state_skips_when_loop_closed(caplog):
    import logging
    from app.routers import simulation as sim_module

    closed_loop = asyncio.new_event_loop()
    closed_loop.close()

    original_loop = sim_module._main_loop
    sim_module._main_loop = closed_loop

    try:
        with caplog.at_level(logging.WARNING, logger="app.routers.simulation"):
            sim_module._broadcast_state()
        assert "no event loop" in caplog.text
    finally:
        sim_module._main_loop = original_loop


def test_broadcast_state_removes_dead_client():
    from app.routers import simulation as sim_module

    loop = asyncio.new_event_loop()

    dead_ws = MagicMock()
    async def failing_send(_):
        raise RuntimeError("connection closed")
    dead_ws.send_json = failing_send

    original_loop = sim_module._main_loop
    sim_module._main_loop = loop
    sim_module._ws_clients.append(dead_ws)

    try:
        sim_module._broadcast_state()
        loop.run_until_complete(asyncio.sleep(0.05))
        assert dead_ws not in sim_module._ws_clients
    finally:
        sim_module._main_loop = original_loop
        sim_module._ws_clients.clear()
        loop.close()
