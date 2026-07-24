import type { SimulationConfig } from '../types/configGeneratorsTypes';

/** Defaults aligned with opencda/scenario_testing/config_yaml/aim_check.yaml */
export const AIM_CHECK_SIM_OVERRIDES: {
  carla?: Partial<SimulationConfig['carla']>;
  opencda?: Partial<SimulationConfig['opencda']>;
} = {
  carla: {
    map: 'Town04',
  },
  opencda: {
    use_multi_class_bp: true,
    bp_meta_path: 'opencda/assets/blueprint_meta/bbx_stats_0915.json',
    perception_activate: false,
    localization_activate: false,
    vehicle_cam_num: 4,
    rsu_cam_num: 4,
    rsu_camera_visualize: 0,
    vehicle_camera_visualize: 0,
    lidar_channels: 32,
    lidar_range: 120,
    lidar_points_per_second: 1_000_000,
    lidar_rotation_frequency: 20,
    lidar_upper_fov: 2,
    lidar_lower_fov: -25,
    lidar_visualize: false,
    rsu_lidar_channels: 32,
    rsu_lidar_range: 120,
    rsu_perception_activate: false,
    ignore_traffic_light: true,
    collision_time_ahead: 2.0,
    vehicle_localization_debug_animation: false,
    local_planner: {
      buffer_size: 12,
      trajectory_update_freq: 15,
      waypoint_update_freq: 9,
      min_dist: 3,
      trajectory_dt: 0.2,
      debug: true,
      debug_trajectory: true,
    },
    lidar_sim: {
      dropoff_general_rate: 0.3,
      dropoff_intensity_limit: 0.7,
      dropoff_zero_intensity: 0.4,
      noise_stddev: 0.02,
    },
    gnss_noise: {
      alt_stddev: 0.05,
      lat_stddev: 3e-6,
      lon_stddev: 3e-6,
      heading_direction_stddev: 0.1,
      speed_stddev: 0.2,
    },
    vehicle_base_color: [122, 156, 111],
    export_profile: 'aim_check',
    v2x_enabled: false,
  },
};

export const AIM_CHECK_CAV_BEHAVIOR_SERVICES = [
  { type: 'self_informer' as const },
  { type: 'aim_client' as const, debug: true },
  { type: 'movement_controller' as const },
];

export const AIM_CHECK_RSU_BEHAVIOR_SERVICES = [
  {
    type: 'aim_server' as const,
    debug: true,
    control_radius: 15,
    model: 'MTP',
    underling_model: 'GNN_mtl_gnn',
    hidden_channels: 128,
    weight: 'model_rot_gnn_mtl_np_sumo_0911_e3_1930.pth',
    priority: 1,
  },
];

export const AIM_CHECK_CAV_COLOR: [number, number, number] = [156, 255, 206];
