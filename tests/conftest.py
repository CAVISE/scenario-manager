import os
import sys
import types

import pytest
import yaml
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

os.environ.setdefault("DB_NAME", "scenario_manager_test")
os.environ.setdefault("DB_USER", "scenario_manager_test")
os.environ.setdefault("DB_PASSWORD", "scenario_manager_test")
os.environ.setdefault("DB_HOST", "db")
os.environ.setdefault("DB_PORT", "5432")
os.environ.setdefault("DB_ENCODING", "UTF8")
os.environ.setdefault("CARLA_HOST", "localhost")
os.environ.setdefault("CARLA_PORT", "2000")
os.environ.setdefault("CARLA_TIMEOUT_SECONDS", "60")

def _build_fake_carla_module() -> types.ModuleType:
  carla = types.ModuleType("carla")

  class FakeClient:
    def __init__(self, host: str, port: int):
      self.host = host
      self.port = port

    def set_timeout(self, _: float):
      return None

    def get_world(self):
      return types.SimpleNamespace(
        get_actors=lambda: [],
        get_blueprint_library=lambda: [],
        spawn_actor=lambda *args, **kwargs: None,
        try_spawn_actor=lambda *args, **kwargs: None,
        debug=types.SimpleNamespace(draw_string=lambda *args, **kwargs: None),
      )

    def get_trafficmanager(self):
      return types.SimpleNamespace(
        set_random_device_seed=lambda *args, **kwargs: None,
        update_vehicle_lights=lambda *args, **kwargs: None,
        random_left_lanechange_percentage=lambda *args, **kwargs: None,
        random_right_lanechange_percentage=lambda *args, **kwargs: None,
        auto_lane_change=lambda *args, **kwargs: None,
        set_path=lambda *args, **kwargs: None,
      )

  class FakeTransform:
    def __init__(self, location, rotation=None):
      self.location = location
      self.rotation = rotation

  class FakeLocation:
    def __init__(self, x=0, y=0, z=0):
      self.x = x
      self.y = y
      self.z = z

  class FakeRotation:
    def __init__(self, pitch=0, yaw=0, roll=0):
      self.pitch = pitch
      self.yaw = yaw
      self.roll = roll

  class FakeColor:
    def __init__(self, r=0, g=0, b=0):
      self.r = r
      self.g = g
      self.b = b

  carla.Client = FakeClient
  carla.Transform = FakeTransform
  carla.Location = FakeLocation
  carla.Rotation = FakeRotation
  carla.Color = FakeColor
  carla.WeatherParameters = types.SimpleNamespace(
    ClearNoon="ClearNoon",
    CloudyNoon="CloudyNoon",
    WetNoon="WetNoon",
    WetCloudyNoon="WetCloudyNoon",
    SoftRainNoon="SoftRainNoon",
    MidRainyNoon="MidRainyNoon",
    HardRainNoon="HardRainNoon",
    ClearSunset="ClearSunset",
    CloudySunset="CloudySunset",
    WetSunset="WetSunset",
    WetCloudySunset="WetCloudySunset",
    SoftRainSunset="SoftRainSunset",
    MidRainSunset="MidRainSunset",
    HardRainSunset="HardRainSunset",
  )
  return carla


sys.modules["carla"] = _build_fake_carla_module()
sys.modules["carla.libcarla"] = types.ModuleType("carla.libcarla")


@pytest.fixture
def db_session():
  from app.models import Base

  engine = create_engine(
    "sqlite+pysqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
  )
  Base.metadata.create_all(engine)
  with Session(engine, expire_on_commit=False) as session:
    yield session
  Base.metadata.drop_all(engine)
  engine.dispose()


@pytest.fixture
def scenario_client(db_session):
  from app.database import get_session
  from main import app

  def override_session():
    yield db_session

  app.dependency_overrides[get_session] = override_session
  client = TestClient(app)
  yield client
  client.close()
  app.dependency_overrides.pop(get_session, None)


def make_open_cda_config(cav_count=1, rsu_count=0, attacks=None):
  camera = {
    "visualize": 0,
    "num": 1,
    "positions": [[2.5, 0, 1.0, 0]],
  }
  lidar = {
    "visualize": False,
    "channels": 32,
    "range": 50,
    "points_per_second": 100_000,
    "rotation_frequency": 20,
    "upper_fov": 10,
    "lower_fov": -30,
    "dropoff_general_rate": 0,
    "dropoff_intensity_limit": 1,
    "dropoff_zero_intensity": 0,
    "noise_stddev": 0,
  }
  localization = {
    "activate": True,
    "navigation_source": "estimated",
    "dt": "${world.fixed_delta_seconds}",
    "gnss": {
      "noise_alt_stddev": 0.001,
      "noise_lat_stddev": 1e-6,
      "noise_lon_stddev": 1e-6,
      "heading_direction_stddev": 0.1,
      "speed_stddev": 0.2,
    },
    "debug_helper": {
      "show_animation": False,
      "x_scale": 1,
      "y_scale": 100,
    },
  }
  perception = {
    "activate": False,
    "camera": camera,
    "lidar": lidar,
  }
  cavs = [
    {
      "name": f"cav{index + 1}",
      "spawn_position": [index, index, 0, 0, 0, 0],
      "destination": [index + 10, index, 0],
      "id": index + 1,
    }
    for index in range(cav_count)
  ]
  rsus = [
    {
      "name": f"rsu{index + 1}",
      "spawn_position": [index, index, 0, 0, 0, 0],
      "id": -(index + 1),
      "v2x": {"communication_range": 35},
      "sensing": {"perception": {"detection_range": 100}},
    }
    for index in range(rsu_count)
  ]
  return {
    "description": "Test OpenCDA config",
    "attacks": attacks or [],
    "world": {
      "town": "Town03",
      "sync_mode": True,
      "fixed_delta_seconds": 0.05,
      "client_port": 2000,
      "seed": 42,
      "weather": {
        "sun_altitude_angle": 60,
        "cloudiness": 80,
        "precipitation": 70,
        "precipitation_deposits": 80,
        "wind_intensity": 0,
        "fog_density": 80,
        "fog_distance": 0,
        "fog_falloff": 80,
        "wetness": 0,
      },
    },
    "blueprint": {"use_multi_class_bp": False},
    "vehicle_base": {
      "sensing": {"perception": perception, "localization": localization},
      "map_manager": {
        "pixels_per_meter": 2,
        "raster_size": [224, 224],
        "lane_sample_resolution": 0.1,
        "visualize": False,
        "activate": True,
      },
      "safety_manager": {
        "print_message": True,
        "collision_sensor": {"history_size": 30, "col_thresh": 1},
        "stuck_dector": {"len_thresh": 500, "speed_thresh": 0.5},
        "offroad_dector": [],
        "traffic_light_detector": {"light_dist_thresh": 20},
      },
      "behavior": {
        "max_speed": 45,
        "tailgate_speed": 55,
        "speed_lim_dist": 5,
        "speed_decrease": 15,
        "safety_time": 4,
        "emergency_param": 0.4,
        "ignore_traffic_light": True,
        "overtake_allowed": True,
        "collision_time_ahead": 1.5,
        "overtake_counter_recover": 35,
        "sample_resolution": 2,
        "local_planner": {
          "buffer_size": 12,
          "trajectory_update_freq": 15,
          "waypoint_update_freq": 9,
          "min_dist": 3,
          "trajectory_dt": 0.2,
          "debug": False,
          "debug_trajectory": False,
        },
      },
      "controller": {
        "type": "pid_controller",
        "args": {
          "lat": {"k_p": 0.75, "k_d": 0.02, "k_i": 0.4},
          "lon": {"k_p": 0.37, "k_d": 0.024, "k_i": 0.032},
          "dynamic": False,
          "dt": "${world.fixed_delta_seconds}",
          "max_brake": 1,
          "max_throttle": 1,
          "max_steering": 0.45,
        },
      },
      "v2x": {
        "enabled": True,
        "communication_range": 35,
        "position_source": "estimated",
      },
    },
    "rsu_base": {
      "sensing": {"perception": perception, "localization": localization},
    },
    "carla_traffic_manager": {
      "port": 8000,
      "sync_mode": True,
      "global_distance": 5,
      "global_speed_perc": -100,
      "set_osm_mode": True,
      "auto_lane_change": False,
      "ignore_lights_percentage": 0,
      "ignore_signs_percentage": 0,
      "ignore_walkers_percentage": 0,
      "ignore_vehicles_percentage": 0,
      "random_left_lanechange_percentage": 0,
      "random_right_lanechange_percentage": 0,
      "random": False,
      "vehicle_list": [],
      "range": [],
    },
    "traffic_manager": {
      "global_distance_to_leading_vehicle": 5,
      "synchronous_mode": True,
    },
    "scenario": {"rsu_list": rsus, "single_cav_list": cavs},
  }


@pytest.fixture
def open_cda_config_factory():
  return make_open_cda_config


@pytest.fixture
def open_cda_yaml(open_cda_config_factory):
  return yaml.safe_dump(open_cda_config_factory(), sort_keys=False)
