import type { CarlaWeather } from '@/entities/scenario';
import type {
  OpenCDACoopPerceptionViz,
  OpenCDAControllerPid,
  OpenCDAMapManager,
  OpenCDAMetrics,
  OpenCDAPlatoonBase,
  OpenCDASafetyManager,
  OpenCDAVehicleBehaviorServices,
} from './opencdaFieldTypes';
import type {
  CAPIExtraConfig,
  MPCConfig,
  OpenCDAAttackConfig,
  OpenCDABgSpawnRange,
  OpenCDAGnssNoise,
  OpenCDALidarSim,
  OpenCDALocalPlanner,
  SumoVType,
} from './configPrimitiveTypes';

export type {
  AttackStageType,
  AttackStageTypeWithCustom,
  CAPIExtraConfig,
  MPCConfig,
  OpenCDAAttackConfig,
  OpenCDAAttackStage,
  OpenCDABgSpawnRange,
  OpenCDAGnssNoise,
  OpenCDALidarSim,
  OpenCDALocalPlanner,
  SumoVType,
} from './configPrimitiveTypes';

export type SimulationConfig = {
  sim_duration: number;
  attacks: OpenCDAAttackConfig[];
  max_ticks?: number;
  omnet: {
    tx_power: number;
    bitrate: number;
    beaconing_interval: number;
    max_interf_dist: number;
    protocol: 'ITS-G5' | 'C-V2X' | 'DSRC';
  };
  artery: {
    middleware_update_interval: number;
    datetime: string;
    sumo_config: string;
    sumo_step_length: number;
    sumo_seed: number;
    cam_interval_min: number;
    cam_interval_max: number;
    denm_enabled: boolean;
    cp_service_enabled: boolean;
    rsu_cam_enabled: boolean;
    rsu_denm_enabled: boolean;
  };
  sumo: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [x: string]: any;
    scenario_name: string;
    full_output: boolean;
    vtypes: SumoVType[];
  };
  sionna: {
    carrier_frequency: number;
    max_depth: number;
    num_samples: number;
    los: boolean;
    reflection: boolean;
    diffraction: boolean;
    scattering: boolean;
  };
  carla: {
    map: string;
    weather_preset: CarlaWeather;
    weather_override?: Partial<Record<string, number>>;
    client_port: number;
    seed: number;
    num_vehicles: number;
    num_pedestrians: number;
    fixed_delta_seconds: number;
    traffic_manager_port: number;
    synchronous_mode: boolean;
    sensors: {
      camera: boolean;
      lidar: boolean;
      radar: boolean;
      gnss: boolean;
      imu: boolean;
    };
    lidar_channels: number;
    lidar_range: number;
    camera_fov: number;
  };
  opencda: {
    use_multi_class_bp: boolean;
    bp_meta_path: string;
    bp_class_sample_prob: {
      car: number;
      truck: number;
      bus: number;
      bicycle: number;
      motorcycle: number;
    };
    sumo_port: number;
    sumo_host: string;
    sumo_gui: boolean;
    sumo_client_order: number;
    max_speed: number;
    tailgate_speed: number;
    speed_lim_dist: number;
    speed_decrease: number;
    safety_time: number;
    emergency_param: number;
    ignore_traffic_light: boolean;
    overtake_allowed: boolean;
    collision_time_ahead: number;
    sample_resolution: number;
    overtake_counter_recover: number;
    static_obstacle_avoidance_enabled: boolean;
    lidar_channels: number;
    lidar_range: number;
    lidar_points_per_second: number;
    lidar_rotation_frequency: number;
    lidar_upper_fov: number;
    lidar_lower_fov: number;
    lidar_visualize: boolean;
    vehicle_cam_num: number;
    perception_activate: boolean;
    localization_activate: boolean;
    localization_navigation_source: 'estimated' | 'ground_truth';
    enable_background_traffic: boolean;
    global_speed_perc: number;
    auto_lane_change: boolean;
    ignore_lights_percentage: number;
    bg_vehicle_num: number;
    bg_global_distance: number;
    bg_set_osm_mode: boolean;
    bg_ignore_signs_percentage: number;
    bg_ignore_walkers_percentage: number;
    rsu_perception_activate: boolean;
    rsu_lidar_channels: number;
    rsu_lidar_range: number;
    rsu_cam_num: number;
    rsu_camera_visualize: number;
    vehicle_camera_visualize: number;
    lidar_sim: OpenCDALidarSim;
    local_planner: OpenCDALocalPlanner;
    gnss_noise: OpenCDAGnssNoise;
    vehicle_localization_debug_animation: boolean;
    vehicle_base_color?: [number, number, number];
    v2x_enabled: boolean;
    v2x_communication_range: number;
    v2x_position_source: 'estimated' | 'ground_truth';
    export_profile: 'standard' | 'aim_check';
    export_attacks: boolean;
    export_platoon_base: boolean;
    export_metrics: boolean;
    export_coop_perception: boolean;
    export_vehicle_behavior_services: boolean;
    export_world_client_host: boolean;
    world_client_host: string;
    localization_debug_x_scale: number;
    localization_debug_y_scale: number;
    ignore_vehicles_percentage: number;
    random_left_lanechange_percentage: number;
    random_right_lanechange_percentage: number;
    map_manager: OpenCDAMapManager;
    safety_manager: OpenCDASafetyManager;
    controller_pid: OpenCDAControllerPid;
    platoon_base: OpenCDAPlatoonBase;
    metrics: OpenCDAMetrics;
    vehicle_behavior_services: OpenCDAVehicleBehaviorServices;
    coop_perception: OpenCDACoopPerceptionViz;
    bg_traffic_random: boolean;
    bg_spawn_range: OpenCDABgSpawnRange;
  };
  capi: {
    address: string;
    client_id: number;
    traci_hostname: string;
    traci_port: number;
    network: string;
    cmdenv_express_mode: boolean;
    cmdenv_output_file: string;
    scalar_recording: boolean;
    vector_recording: boolean;
    capi_log_level: 'debug' | 'info' | 'warn' | 'error';
    middleware_update_interval: number;
    datetime: string;
    carrier_frequency: string;
    tx_power: string;
    channel_number: number;
    ca_service_enabled: boolean;
    ca_service_port: number;
    cosim_service_enabled: boolean;
    cosim_service_port: number;
    cosim_filter_pattern: string;
    extra_configs: CAPIExtraConfig[];
  };
  mpc: MPCConfig;
};
