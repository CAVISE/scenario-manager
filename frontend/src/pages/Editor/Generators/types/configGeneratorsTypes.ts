import { CarlaWeather } from "../../../../store/useEditorStore";


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
    weather_preset: CarlaWeather,

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
    lidar_channels: number;
    lidar_range: number;
    lidar_points_per_second: number;
    lidar_rotation_frequency: number;
    lidar_upper_fov: number;
    lidar_lower_fov: number;
    lidar_visualize: boolean;
    perception_activate: boolean;
    localization_activate: boolean;
    enable_background_traffic: boolean;
    global_speed_perc: number;
    auto_lane_change: boolean;
    ignore_lights_percentage: number;
    bg_vehicle_num: number;
    rsu_perception_activate: boolean;
    rsu_lidar_channels: number;
    rsu_lidar_range: number;
    rsu_cam_num: number;
  };
};
export const defaultSimConfig: SimulationConfig = {
  sim_duration: 100,
  omnet: {
    tx_power: 20, bitrate: 6, beaconing_interval: 100, max_interf_dist: 2600, protocol: 'DSRC',
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
    lidar_channels: 32,
    lidar_range: 120,
    lidar_points_per_second: 1_000_000,
    lidar_rotation_frequency: 20,
    lidar_upper_fov: 2,
    lidar_lower_fov: -25,
    lidar_visualize: false,
    perception_activate: false,
    localization_activate: false,
    enable_background_traffic: false,
    global_speed_perc: -10,
    auto_lane_change: true,
    ignore_lights_percentage: 0,
    bg_vehicle_num: 15,
    rsu_perception_activate: false,
    rsu_lidar_channels: 32,
    rsu_lidar_range: 120,
    rsu_cam_num: 0,
  },
};
