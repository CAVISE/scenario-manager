import sqlite3
from types import SimpleNamespace

from simulation.app.routers import schemas
from simulation.app.tasks import work


class FakeVehicle:
  def __init__(self, x=0, y=0):
    self._location = SimpleNamespace(x=x, y=y)
    self.destroyed = False

  def get_location(self):
    return self._location

  def set_autopilot(self, _: bool):
    return None

  def destroy(self):
    self.destroyed = True


class FakeSensor:
  def __init__(self, parent):
    self.parent = parent
    self.destroyed = False

  def listen(self, _: object):
    return None

  def destroy(self):
    self.destroyed = True


class FakeWorld:
  def __init__(self):
    self._vehicle = FakeVehicle()
    self.debug = SimpleNamespace(draw_string=lambda *args, **kwargs: None)
    self._blueprints = _BlueprintLibrary(["vehicle.car"])

  def get_blueprint_library(self):
    return self._blueprints

  def spawn_actor(self, *_args, **_kwargs):
    return self._vehicle

  def try_spawn_actor(self, _bp, _transform, attach_to=None):
    return FakeSensor(attach_to)

  def get_actors(self):
    return []

  def set_weather(self, _weather):
    return None


class FakeClient:
  def __init__(self, _host, _port):
    self.world = FakeWorld()

  def get_world(self):
    return self.world

  def get_trafficmanager(self):
    return SimpleNamespace(
      set_random_device_seed=lambda *a, **k: None,
      update_vehicle_lights=lambda *a, **k: None,
      random_left_lanechange_percentage=lambda *a, **k: None,
      random_right_lanechange_percentage=lambda *a, **k: None,
      auto_lane_change=lambda *a, **k: None,
      set_path=lambda *a, **k: None,
    )


class _BlueprintLibrary(list):
  def find(self, _name):
    return "sensor.camera.rgb"


def _scenario_data():
  return schemas.ScenarioSchema.model_validate(
    {
      "scenario_id": "s1",
      "scenario_name": "Scenario",
      "weather": "ClearNoon",
      "scenario": [
        {
          "vehicle": "car",
          "color": {"r": 0, "g": 0, "b": 0},
          "active": True,
          "path": [{"x": 0, "y": 0, "z": 0}, {"x": 1, "y": 1, "z": 0}],
        }
      ],
    }
  )


def test_has_reached_destination_true_when_close():
  vehicle = FakeVehicle(1, 1)
  destination = SimpleNamespace(path=[SimpleNamespace(x=0, y=0), SimpleNamespace(x=2, y=2)])
  assert work.has_reached_destination(vehicle, destination, threshold=2.0) is True


def test_do_scenario_updates_report_status(tmp_path, monkeypatch):
  db_path = tmp_path / "db.db"
  conn = sqlite3.connect(db_path)
  conn.execute(
    "CREATE TABLE reports (id INTEGER PRIMARY KEY, scenario_id TEXT, scenario_name TEXT, status BOOLEAN)"
  )
  conn.execute("INSERT INTO reports (id, scenario_id, scenario_name, status) VALUES (1, 's1', 'Scenario', 'false')")
  conn.commit()
  conn.close()

  monkeypatch.setattr(work.config, "SQLDB_NAME", str(db_path))
  monkeypatch.setattr(work.carla, "Client", FakeClient)
  monkeypatch.setattr(work.services, "draw_path", lambda *args, **kwargs: None)
  monkeypatch.setattr(work.services, "weather_setter", lambda *args, **kwargs: None)

  work.do_scenario("localhost", 2000, _scenario_data(), "s1", 1)

  conn = sqlite3.connect(db_path)
  row = conn.execute("SELECT status FROM reports WHERE id=1").fetchone()
  conn.close()
  assert row is not None
  assert row[0] == "true"
