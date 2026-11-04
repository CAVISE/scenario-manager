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
  heading_direction_stddev: number;
  speed_stddev: number;
};

export type OpenCDABgSpawnRange = {
  x_min: number;
  x_max: number;
  y_min: number;
  y_max: number;
  x_step: number;
  y_step: number;
};

export type AttackStageType = 'sniffer' | 'dropper' | 'replayer' | 'spoofer';

export type AttackStageTypeWithCustom =
  AttackStageType | (string & { __brand?: 'custom_attack_type' });

export type OpenCDAAttackStage = {
  id: string;
  type: AttackStageTypeWithCustom;
  capabilities?: string[];
  params?: Record<string, unknown>;
  requirements?: Record<string, unknown>;
  stage_start_trigger?: Record<string, unknown>;
  stage_stop_trigger?: Record<string, unknown>;
};

export type OpenCDAAttackConfig = {
  name: string;
  requirements?: Record<string, unknown>;
  start_trigger?: Record<string, unknown>;
  stop_trigger?: Record<string, unknown>;
  targets?: Record<string, unknown>;
  stages?: OpenCDAAttackStage[];
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
  id: string;
  minGap: number;
  tau: number;
  vClass: string;
  carFollowModel: string;
  speedFactor: string;
  color?: string;
  accel?: number;
};

export type CAPIExtraConfig = {
  name: string;
  path_loss_type: string;
  small_scale_variations: boolean;
  visualization: boolean;
};
