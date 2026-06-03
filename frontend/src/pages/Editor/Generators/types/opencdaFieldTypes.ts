/** Nested OpenCDA blocks matching default.yaml / upstream CAVISE configs. */

export type OpenCDAMapManager = {
  pixels_per_meter: number;
  raster_size: [number, number];
  lane_sample_resolution: number;
  visualize: boolean;
  activate: boolean;
};

export type OpenCDASafetyManager = {
  print_message: boolean;
  collision_history_size: number;
  collision_col_thresh: number;
  stuck_len_thresh: number;
  stuck_speed_thresh: number;
  traffic_light_dist_thresh: number;
};

export type OpenCDAControllerPid = {
  type: string;
  lat_k_p: number;
  lat_k_d: number;
  lat_k_i: number;
  lon_k_p: number;
  lon_k_d: number;
  lon_k_i: number;
  dynamic: boolean;
  max_brake: number;
  max_throttle: number;
  max_steering: number;
};

export type OpenCDAPlatoonBase = {
  max_capacity: number;
  inter_gap: number;
  open_gap: number;
  warm_up_speed: number;
  change_leader_speed: boolean;
  leader_speeds_profile: [number, number];
  stage_duration: number;
  metric_time_gap_warmup: number;
  metric_distance_gap_warmup: number;
};

export type OpenCDAMetrics = {
  localization_trace_warmup: number;
  behavior_speed_warmup: number;
  behavior_acceleration_warmup: number;
  behavior_ttc_warmup: number;
  behavior_hard_brake_warmup: number;
};

export type OpenCDAVehicleBehaviorServices = {
  self_informer: boolean;
  movement_controller: boolean;
};

export type OpenCDACoopPerceptionViz = {
  background: [number, number, number];
  bbox_line_thickness: number;
  image_dpi: number;
  lidar_other_color: [number, number, number];
  bbox_gt_color: [number, number, number];
  bbox_pred_color: [number, number, number];
};

export const defaultOpenCDAMapManager: OpenCDAMapManager = {
  pixels_per_meter: 2,
  raster_size: [224, 224],
  lane_sample_resolution: 0.1,
  visualize: true,
  activate: true,
};

export const defaultOpenCDASafetyManager: OpenCDASafetyManager = {
  print_message: true,
  collision_history_size: 30,
  collision_col_thresh: 1,
  stuck_len_thresh: 500,
  stuck_speed_thresh: 0.5,
  traffic_light_dist_thresh: 20,
};

export const defaultOpenCDAController: OpenCDAControllerPid = {
  type: 'pid_controller',
  lat_k_p: 0.75,
  lat_k_d: 0.02,
  lat_k_i: 0.4,
  lon_k_p: 0.37,
  lon_k_d: 0.024,
  lon_k_i: 0.032,
  dynamic: false,
  max_brake: 1.0,
  max_throttle: 1.0,
  max_steering: 0.3,
};

export const defaultOpenCDAPlatoonBase: OpenCDAPlatoonBase = {
  max_capacity: 10,
  inter_gap: 0.6,
  open_gap: 1.2,
  warm_up_speed: 55,
  change_leader_speed: true,
  leader_speeds_profile: [85, 95],
  stage_duration: 10,
  metric_time_gap_warmup: 100,
  metric_distance_gap_warmup: 100,
};

export const defaultOpenCDAMetrics: OpenCDAMetrics = {
  localization_trace_warmup: 0,
  behavior_speed_warmup: 1,
  behavior_acceleration_warmup: 1,
  behavior_ttc_warmup: 1,
  behavior_hard_brake_warmup: 1,
};

export const defaultOpenCDAVehicleBehaviorServices: OpenCDAVehicleBehaviorServices =
  {
    self_informer: true,
    movement_controller: true,
  };

export const defaultOpenCDACoopPerceptionViz: OpenCDACoopPerceptionViz = {
  background: [17, 34, 42],
  bbox_line_thickness: 3,
  image_dpi: 600,
  lidar_other_color: [92, 219, 149],
  bbox_gt_color: [237, 255, 246],
  bbox_pred_color: [164, 73, 148],
};
