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
