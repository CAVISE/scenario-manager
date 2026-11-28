"""Types and ranges of the config fields the fork reads.

Fields and limits follow the fork's code at the commit in data/catalog.yaml.
Unknown keys are allowed because the fork ignores them. Relations between
fields, such as physics limits or service dependencies, are checked by rules.
"""

from typing import Annotated, Any, Literal

from pydantic import (
    AfterValidator,
    BaseModel,
    ConfigDict,
    Field,
    NonNegativeInt,
    PositiveInt,
    StrictBool,
    model_validator,
)
from pydantic_core import PydanticCustomError

# Error type of a Flag that is not a boolean; reported as a warning because
# the fork runs with the value's truthiness.
TRUTHY_FLAG = "truthy_flag"


def _flag(value: Any) -> Any:
    if not isinstance(value, bool):
        raise PydanticCustomError(
            TRUTHY_FLAG,
            "Input should be a boolean; the fork reads it as {truthy}",
            {"truthy": str(bool(value))},
        )
    return value


Number = Annotated[float, Field(allow_inf_nan=False)]
NonNegative = Annotated[float, Field(ge=0, allow_inf_nan=False)]
Positive = Annotated[float, Field(gt=0, allow_inf_nan=False)]
# The fork checks isinstance(value, (int, float)), so numeric strings fail.
StrictPositive = Annotated[float, Field(gt=0, strict=True, allow_inf_nan=False)]
Percent = Annotated[float, Field(ge=0, le=100)]
Port = Annotated[int, Field(ge=1, le=65535)]
Name = Annotated[str, Field(min_length=1)]
Color = Annotated[list[Number], Field(min_length=3)]
Position = Annotated[list[Number], Field(min_length=6)]
# StrictBool: the fork checks the type or passes the value to CARLA.
# Flag: the fork only tests the value's truthiness.
Flag = Annotated[Any, AfterValidator(_flag)]


class Section(BaseModel):
    model_config = ConfigDict(extra="allow")


# Root sections


class Weather(Section):
    sun_altitude_angle: Number
    cloudiness: Number
    precipitation: Number
    precipitation_deposits: Number
    wind_intensity: Number
    fog_density: Number
    fog_distance: Number
    fog_falloff: Number
    wetness: Number


class World(Section):
    town: Name | None = None
    sync_mode: Flag
    client_port: Port
    seed: Annotated[int, Field(ge=0, le=2**32 - 1)]
    fixed_delta_seconds: Positive
    substepping: StrictBool = True
    max_substep_delta_time: Positive = 0.01
    max_substeps: Annotated[int, Field(ge=1, le=16, strict=True)] = 10
    spectator_as_ego: StrictBool | None = None
    tile_stream_distance: StrictPositive | None = None
    actor_active_distance: StrictPositive | None = None
    weather: Weather


class Blueprint(Section):
    use_multi_class_bp: Flag
    bp_meta_path: Name | None = None
    bp_class_sample_prob: dict[str, NonNegative] | None = None


class CarlaTrafficManager(Section):
    sync_mode: StrictBool
    global_distance: Number
    global_speed_perc: Number
    set_osm_mode: StrictBool
    auto_lane_change: StrictBool
    random: Flag
    ignore_lights_percentage: Percent
    ignore_signs_percentage: Percent
    ignore_vehicles_percentage: Percent
    ignore_walkers_percentage: Percent
    random_left_lanechange_percentage: Percent
    random_right_lanechange_percentage: Percent


class Sumo(Section):
    host: Name
    port: Port
    gui: Flag
    client_order: int
    # Must exist, although the fork does not use the value.
    step_length: Any


class SensorSync(Section):
    timeout_seconds: Positive = 1.0


class CoperceptionVisualization(Section):
    background: Color | None = None
    bbox_line_thickness: PositiveInt | None = None
    image_dpi: PositiveInt | None = None
    lidar_point_colors: dict[str, Color] | None = None
    bbox_colors: dict[str, Color] | None = None


class Coperception(Section):
    sensor_sync: SensorSync | None = None
    visualization: CoperceptionVisualization | None = None


class CustomActor(Section):
    spawn_position: Position | None = None
    spawn_special: list[Number] | None = None
    model: Name | None = None
    color: Color | None = None
    role_name: Name | None = None

    @model_validator(mode="after")
    def spawn_point(self) -> "CustomActor":
        if self.spawn_position is None and self.spawn_special is None:
            raise ValueError("spawn_position or spawn_special is required")
        return self


class Scenario(Section):
    custom_actor_list: list[CustomActor] | None = None


ROOT_SECTIONS: dict[str, type[Section]] = {
    "world": World,
    "blueprint": Blueprint,
    "carla_traffic_manager": CarlaTrafficManager,
    "sumo": Sumo,
    "coperception": Coperception,
    "scenario": Scenario,
}


# Agents, after agent_base and their base are merged in


class Camera(Section):
    visualize: NonNegativeInt
    num: NonNegativeInt
    positions: list[Annotated[list[Number], Field(min_length=4, max_length=4)]]


class Lidar(Section):
    visualize: Flag
    channels: PositiveInt
    range: Positive
    points_per_second: PositiveInt
    rotation_frequency: Positive
    upper_fov: Number
    lower_fov: Number
    dropoff_general_rate: Number
    dropoff_intensity_limit: Number
    dropoff_zero_intensity: Number
    noise_stddev: NonNegative


class Perception(Section):
    enabled: StrictBool = True
    activate: Flag = False
    camera: Camera
    lidar: Lidar


class Gnss(Section):
    noise_alt_stddev: NonNegative
    noise_lat_stddev: NonNegative
    noise_lon_stddev: NonNegative


class Localization(Section):
    gnss: Gnss


class Sensing(Section):
    perception: Perception
    localization: Localization


class Agent(Section):
    role_name: Name
    model: Name | None = None
    color: Color | None = None
    sensing: Sensing


class CavLocalization(Localization):
    dt: Positive


class CavSensing(Sensing):
    localization: CavLocalization


class MapManager(Section):
    pixels_per_meter: Positive
    raster_size: Annotated[list[PositiveInt], Field(min_length=2)]
    lane_sample_resolution: Positive
    visualize: Flag


class CollisionSensor(Section):
    history_size: NonNegativeInt
    col_thresh: Number


class StuckDetector(Section):
    len_thresh: NonNegativeInt
    speed_thresh: Number


class TrafficLightDetector(Section):
    light_dist_thresh: Number


class SafetyManager(Section):
    print_message: Flag
    collision_sensor: CollisionSensor
    # The fork reads the misspelled keys.
    stuck_dector: StuckDetector
    offroad_dector: Any
    traffic_light_detector: TrafficLightDetector


class LocalPlanner(Section):
    buffer_size: NonNegativeInt
    trajectory_update_freq: PositiveInt
    waypoint_update_freq: PositiveInt
    min_dist: Number
    trajectory_dt: Positive
    debug: Flag
    debug_trajectory: Flag


class Behavior(Section):
    max_speed: Number
    tailgate_speed: Number
    speed_lim_dist: Number
    speed_decrease: Number
    safety_time: Number
    emergency_param: Number
    collision_time_ahead: Number
    ignore_traffic_light: Flag
    overtake_allowed: Flag
    sample_resolution: Positive
    debug: Flag = False
    local_planner: LocalPlanner


class Gains(Section):
    k_p: Number
    k_d: Number
    k_i: Number


class ControllerArgs(Section):
    lat: Gains
    lon: Gains
    dynamic: Flag
    dt: Positive
    max_brake: Number
    max_throttle: Number
    max_steering: Number


class Controller(Section):
    type: Literal["pid_controller"]
    args: ControllerArgs


class Cav(Agent):
    sensing: CavSensing
    carla_autopilot_port: int = 8000
    map_manager: MapManager
    safety_manager: SafetyManager
    behavior: Behavior
    controller: Controller


class Rsu(Agent):
    pass
