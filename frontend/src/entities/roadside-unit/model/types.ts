export type V2XProtocol = 'ITS-G5' | 'C-V2X' | 'DSRC';
export type AntennaType = 'isotropic' | 'dipole' | 'tr38901' | 'planar_array';
export type Polarization = 'vertical' | 'horizontal' | 'cross';
export type NetworkProtocol = 'GeoNetworking' | 'BTP' | 'IPv4' | 'IPv6';

export type AIMServerService = {
  type: 'aim_server';
  debug?: boolean;
  control_radius?: number;
  control_center_location?: { x: number; y: number; z: number };
  model?: string;
  underling_model?: string;
  hidden_channels?: number;
  weight?: string;
  priority?: number;
};

export type RsuBehaviorService = AIMServerService;

export type RSU = {
  id: string;
  name: string;
  x: number;
  y: number;
  z: number;
  tx_power: number;
  frequency: number;
  range: number;
  protocol: V2XProtocol;
  network_protocol: NetworkProtocol;
  antenna_type: AntennaType;
  antenna_height: number;
  antenna_gain: number;
  polarization: Polarization;
  mimo_rows: number;
  mimo_columns: number;
  element_spacing: number;
  azimuth: number;
  tilt: number;
  cam_interval: number;
  beacon_interval: number;
  scenario: string;
  opencda_name?: string;
  opencda_id?: number;
  opencda_behavior_services?: RsuBehaviorService[];
  opencda_color?: [number, number, number];
  opencda_sensing?: {
    perception_activate?: boolean;
    detection_range?: number;
    camera_visualize?: number;
    camera_num?: number;
    camera_positions?: [number, number, number, number][];
    lidar_visualize?: boolean;
    lidar_channels?: number;
    lidar_range?: number;
    lidar_points_per_second?: number;
    lidar_rotation_frequency?: number;
    lidar_upper_fov?: number;
    lidar_lower_fov?: number;
    lidar_dropoff_general_rate?: number;
    lidar_dropoff_intensity_limit?: number;
    lidar_dropoff_zero_intensity?: number;
    lidar_noise_stddev?: number;
    localization_activate?: boolean;
    gnss_noise_alt_stddev?: number;
    gnss_noise_lat_stddev?: number;
    gnss_noise_lon_stddev?: number;
  };
};

export type CreateRsuParams = Pick<RSU, 'id' | 'name' | 'x' | 'y' | 'z'>;
