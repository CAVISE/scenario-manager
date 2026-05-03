import sys
import types

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

