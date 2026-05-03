from fastapi.testclient import TestClient

from main import app
from app import routes


class DummyCursor:
  def __init__(self, rows=None, one=None, rowcount=1):
    self._rows = rows or []
    self._one = one
    self.rowcount = rowcount
    self.executed = []

  def execute(self, query, params=None):
    self.executed.append((query, params))
    return self

  def fetchall(self):
    return self._rows

  def fetchone(self):
    return self._one

  def close(self):
    return None


class DummyConn:
  def __init__(self, cursor):
    self._cursor = cursor
    self.committed = False
    self.rolled_back = False

  def cursor(self):
    return self._cursor

  def commit(self):
    self.committed = True

  def rollback(self):
    self.rolled_back = True

  def close(self):
    return None


def test_status_endpoint_returns_state():
  routes.simulation_state.update({"running": False, "status": "idle", "error": None, "map": None})
  client = TestClient(app)

  response = client.get("/api/status")
  assert response.status_code == 200
  assert response.json()["status"] == "idle"


def test_upload_scenario_requires_name_field():
  client = TestClient(app)
  response = client.post("/api/upload_scenario", json={"scenario_id": "1"})

  assert response.status_code == 500
  assert "name_of_scenario" in response.json()["detail"]


def test_load_all_scenarios_returns_rows(monkeypatch):
  rows = [(1, "42", "Test", "preview", "note")]
  cursor = DummyCursor(rows=rows)
  conn = DummyConn(cursor)
  monkeypatch.setattr(routes, "get_db_connection", lambda: conn)
  client = TestClient(app)

  response = client.get("/api/load_all_scenarios")
  assert response.status_code == 200
  body = response.json()
  assert body["status"] == "success"
  assert body["count"] == 1
  assert body["scenarios"][0]["scenario_id"] == "42"


def test_load_scenario_404_when_missing(monkeypatch):
  cursor = DummyCursor(one=None)
  conn = DummyConn(cursor)
  monkeypatch.setattr(routes, "get_db_connection", lambda: conn)
  client = TestClient(app)

  response = client.get("/api/load_scenario/missing")
  assert response.status_code == 404
  assert response.json()["detail"] == "Scenario not found"


def test_delete_scenario_not_found(monkeypatch):
  cursor = DummyCursor(rowcount=0)
  conn = DummyConn(cursor)
  monkeypatch.setattr(routes, "get_db_connection", lambda: conn)
  client = TestClient(app)

  response = client.post("/api/delete_scenario", json={"scenario_id": "missing"})
  assert response.status_code == 404
  assert response.json()["detail"] == "Scenario not found"
