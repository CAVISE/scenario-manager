import { CarlaWeather } from "../../../../store/useEditorStore";

export type OpenCDALidarSim = {
  dropoff_general_rate: number;
  dropoff_intensity_limit: number;
  dropoff_zero_intensity: number;
  noise_stddev: number;
};

export type OpenCDALocalPlanner = {
  buffer_size: number;
  trajectory_update_freq: number;
  waypoint_update_freq: number;
  min_dist: number;
  trajectory_dt: number;
  debug: boolean;
  debug_trajectory: boolean;
};

export type OpenCDAGnssNoise = {
  alt_stddev: number;
  lat_stddev: number;
  lon_stddev: number;
};

export type OpenCDABgSpawnRange = {
  x_min: number;
  x_max: number;
  y_min: number;
  y_max: number;
  z_min: number;
  z_max: number;
};
export type MPCConfig = {
  NX: number;
  NU: number;
  T: number;
  T_aug: number;

  dist_stop: number;
  speed_stop: number;
  time_max: number;
  iter_max: number;

  target_speed: number;
  n_ind: number;
  dt: number;
  d_dist: number;
  du_res: number;
  Qf: [number, number, number, number];
  R: [number, number];
  Rd: [number, number];

  RF: number;
  RB: number;
  W: number;
  wd_ratio: number;
  WB: number;
  TR: number;
  TW: number;

  steer_deg: number;
  steer_change_deg: number;
  speed_max_kph: number;
  speed_min_kph: number;
  acceleration_max: number;
};
export type SumoVType = {
  id:              string;
  minGap:          number;
  tau:             number;
  vClass:          string;
  carFollowModel:  string;
  speedFactor:     string;
  color?:          string;
  accel?:          number;
};

export type CAPIExtraConfig = {
  name:                   string;
  path_loss_type:         string;
  small_scale_variations: boolean;
  visualization:          boolean;
};

export type SimulationConfig = {
  sim_duration: number;
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
    scenario_name: string;
    net_file:      string;
    full_output:   boolean;
    vtypes:        SumoVType[];
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
    client_port: number;
    seed: number;
    num_vehicles: number;
    num_pedestrians: number;
    fixed_delta_seconds: number;
    traffic_manager_port: number;
    synchronous_mode: boolean;
    sensors: { camera: boolean; lidar: boolean; radar: boolean; gnss: boolean; imu: boolean };
    lidar_channels: number;
    lidar_range: number;
    camera_fov: number;
  };
  opencda: {
    use_multi_class_bp: boolean;
    bp_meta_path: string;
    bp_class_sample_prob: {
      car: number; truck: number; bus: number; bicycle: number; motorcycle: number;
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
    bg_traffic_random: boolean;
    bg_spawn_range: OpenCDABgSpawnRange;
  };
  capi: {
    address:                    string;   
    client_id:                  number;
    traci_hostname:             string;   
    traci_port:                 number;
    network:                    string;   
    cmdenv_express_mode:        boolean;
    cmdenv_output_file:         string;   
    scalar_recording:           boolean;
    vector_recording:           boolean;
    capi_log_level:             'debug' | 'info' | 'warn' | 'error';
    middleware_update_interval: number;   
    datetime:                   string;
    carrier_frequency:          string;  
    tx_power:                   string;   
    channel_number:             number;  
    ca_service_enabled:         boolean;
    ca_service_port:            number;
    cosim_service_enabled:      boolean;
    cosim_service_port:         number;
    cosim_filter_pattern:       string;   
    extra_configs:              CAPIExtraConfig[];
  };
  mpc: MPCConfig;
};

export const defaultSimConfig: SimulationConfig = {
  sim_duration: 100,
  omnet: {
    tx_power: 20, bitrate: 6, beaconing_interval: 100, max_interf_dist: 2600, protocol: 'ITS-G5',
  },
  artery: {
    middleware_update_interval: 100,
    datetime: '2024-06-01 12:00:00',
    sumo_config: 'scenario.sumocfg',
    sumo_step_length: 0.1,
    sumo_seed: 42,
    cam_interval_min: 100,
    cam_interval_max: 1000,
    denm_enabled: true,
    cp_service_enabled: false,
    rsu_cam_enabled: true,
    rsu_denm_enabled: true,
  },
  sionna: {
    carrier_frequency: 5.9e9, max_depth: 5, num_samples: 1e6,
    los: true, reflection: true, diffraction: true, scattering: false,
  },
  carla: {
    map: 'Town03',
    weather_preset: 'ClearNoon',
    client_port: 2000,
    seed: 0,
    num_vehicles: 50, num_pedestrians: 20,
    fixed_delta_seconds: 0.05,
    traffic_manager_port: 8000,
    synchronous_mode: true,
    sensors: { camera: true, lidar: true, radar: false, gnss: true, imu: true },
    lidar_channels: 32, lidar_range: 50, camera_fov: 90,
  },
  opencda: {
    use_multi_class_bp: true,
    bp_meta_path: 'opencda/assets/blueprint_meta/bbx_stats_0915.json',
    bp_class_sample_prob: { car: 0.5, truck: 0.1, bus: 0.1, bicycle: 0.1, motorcycle: 0.1 },
    sumo_port: 3000,
    sumo_host: 'sumo',
    sumo_gui: true,
    sumo_client_order: 1,
    max_speed: 60,
    tailgate_speed: 60,
    speed_lim_dist: 3,
    speed_decrease: 15,
    safety_time: 4,
    emergency_param: 0.4,
    ignore_traffic_light: false,
    overtake_allowed: false,
    collision_time_ahead: 2.0,
    sample_resolution: 4.5,
    overtake_counter_recover: 35,
    lidar_channels: 32,
    lidar_range: 120,
    lidar_points_per_second: 1_000_000,
    lidar_rotation_frequency: 20,
    lidar_upper_fov: 2,
    lidar_lower_fov: -25,
    lidar_visualize: false,
    vehicle_cam_num: 1,
    perception_activate: false,
    localization_activate: false,
    enable_background_traffic: false,
    global_speed_perc: -10,
    auto_lane_change: true,
    ignore_lights_percentage: 0,
    bg_vehicle_num: 15,
    bg_global_distance: 5,
    bg_set_osm_mode: true,
    bg_ignore_signs_percentage: 0,
    bg_ignore_walkers_percentage: 0,
    rsu_perception_activate: false,
    rsu_lidar_channels: 32,
    rsu_lidar_range: 120,
    rsu_cam_num: 0,
    rsu_camera_visualize: 0,
    vehicle_camera_visualize: 0,
    lidar_sim: {
      dropoff_general_rate: 0.3,
      dropoff_intensity_limit: 0.7,
      dropoff_zero_intensity: 0.4,
      noise_stddev: 0.02,
    },
    local_planner: {
      buffer_size: 12,
      trajectory_update_freq: 15,
      waypoint_update_freq: 9,
      min_dist: 3,
      trajectory_dt: 0.2,
      debug: false,
      debug_trajectory: false,
    },
    gnss_noise: {
      alt_stddev: 0.05,
      lat_stddev: 3e-6,
      lon_stddev: 3e-6,
    },
    vehicle_localization_debug_animation: false,
    bg_traffic_random: true,
    bg_spawn_range: {
      x_min: 0,
      x_max: 500,
      y_min: 0,
      y_max: 500,
      z_min: 3,
      z_max: 3,
    },
  },
  sumo: {
    scenario_name: 'scenario',
    net_file:      'map.net.xml',
    full_output:   false,
    vtypes: [
      {
        id:             'vType_0',
        minGap:         2.0,
        tau:            0.4,
        vClass:         'passenger',
        carFollowModel: 'IDMM',
        speedFactor:    'normc(1.00,0.00)',
      },
    ],
  },
  capi: {
    address:                    'tcp://*:7777',
    client_id:                  1,
    traci_hostname:             'sumo',
    traci_port:                 3000,
    network:                    'artery.inet.World',
    cmdenv_express_mode:        false,
    cmdenv_output_file:         '.cmdenv-log',
    scalar_recording:           false,
    vector_recording:           false,
    capi_log_level:             'debug',
    middleware_update_interval: 0.1,
    datetime:                   '2013-06-01 12:35:00',
    carrier_frequency:          '5.9 GHz',
    tx_power:                   '200 mW',
    channel_number:             180,
    ca_service_enabled:         true,
    ca_service_port:            2001,
    cosim_service_enabled:      true,
    cosim_service_port:         2002,
    cosim_filter_pattern:       '(cav|rsu)-.*',
    extra_configs: [
      {
        name:                   'gemv2',
        path_loss_type:         'Gemv2',
        small_scale_variations: false,
        visualization:          true,
      },
    ],
  },
  mpc: {
    NX: 4, NU: 2, T: 3, T_aug: 30,
    dist_stop: 1.5, speed_stop: 0.5, time_max: 500.0, iter_max: 5,
    target_speed: 10.0, n_ind: 10, dt: 0.1, d_dist: 1.0, du_res: 0.25,
    Qf: [5.0, 5.0, 0.0, 20.0],
    R: [0.01, 5.8],
    Rd: [0.01, 10.1],
    RF: 3.3, RB: 0.8, W: 2.4, wd_ratio: 0.7, WB: 2.5, TR: 0.44, TW: 0.7,
    steer_deg: 60.0, steer_change_deg: 30.0,
    speed_max_kph: 55.0, speed_min_kph: -20.0, acceleration_max: 1.0,
  },
};

export function mergeSimConfigWithDefaults(
  partial: Partial<SimulationConfig> | undefined | null
): SimulationConfig {
  const p = partial ?? {};
  const omnet = { ...defaultSimConfig.omnet, ...p.omnet };
  if (omnet.protocol === 'DSRC') omnet.protocol = 'ITS-G5';
  return {
    ...defaultSimConfig,
    ...p,
    omnet,
    artery: { ...defaultSimConfig.artery, ...p.artery },
    sumo: {
      ...defaultSimConfig.sumo,
      ...p.sumo,
      vtypes: p.sumo?.vtypes ?? defaultSimConfig.sumo.vtypes,
    },
    sionna: { ...defaultSimConfig.sionna, ...p.sionna },
    carla: {
      ...defaultSimConfig.carla,
      ...p.carla,
      sensors: { ...defaultSimConfig.carla.sensors, ...p.carla?.sensors },
    },
    opencda: {
      ...defaultSimConfig.opencda,
      ...p.opencda,
      bp_class_sample_prob: {
        ...defaultSimConfig.opencda.bp_class_sample_prob,
        ...p.opencda?.bp_class_sample_prob,
      },
      lidar_sim: {
        ...defaultSimConfig.opencda.lidar_sim,
        ...p.opencda?.lidar_sim,
      },
      local_planner: {
        ...defaultSimConfig.opencda.local_planner,
        ...p.opencda?.local_planner,
      },
      gnss_noise: {
        ...defaultSimConfig.opencda.gnss_noise,
        ...p.opencda?.gnss_noise,
      },
      bg_spawn_range: {
        ...defaultSimConfig.opencda.bg_spawn_range,
        ...p.opencda?.bg_spawn_range,
      },
    },
    capi: {
      ...defaultSimConfig.capi,
      ...p.capi,
      extra_configs: p.capi?.extra_configs ?? defaultSimConfig.capi.extra_configs,
    },
    mpc: { ...defaultSimConfig.mpc, ...p.mpc },
  };
}