import sys
import types
import asyncio
import pytest
from unittest.mock import MagicMock, patch

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
    from fastapi.testclient import TestClient
    return TestClient(app)

def test_upload_scenario_without_scenario_id(client):
    conn, cursor = make_conn(one=None)

    with patch("app.routers.scenarios.get_conn", return_value=conn):
        response = client.post("/api/upload_scenario", json={
            "name_of_scenario": "No ID Scenario",
        })

    assert response.status_code == 200
    assert response.json()["status"] == "success"
    executed = [call[0][0] for call in cursor.execute.call_args_list]
    assert not any("SELECT 1 FROM scenarios" in q for q in executed)

def test_update_scenario_with_none_fields(client):
    conn, cursor = make_conn(one=("sc-1",))

    with patch("app.routers.scenarios.get_conn", return_value=conn):
        response = client.post("/api/update_scenario", json={
            "scenario_id": "sc-1",
            "scenario_name": None,
            "preview": None,
            "annotation": None,
        })

    assert response.status_code == 200

def test_spawn_yaw_is_zero_when_coords_identical():
    from app.utils import json_to_single_cav_list

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
    result, _ = json_to_single_cav_list(payload)
    cav = result["scenario"]["single_cav_list"][0]
    assert cav["spawn_position"][4] == 0.0

def test_unknown_map_uses_zero_offset():
    from app.utils import json_to_single_cav_list

    payload = {
        "map": "UnknownMap",
        "scenario": [{
            "vehicle": "car",
            "path": [{"x": 10, "y": 20, "z": 0, "points": []}]
        }]
    }
    result, _ = json_to_single_cav_list(payload)
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
