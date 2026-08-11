import {
  Lidar,
  Point,
  RsuBehaviorService,
  SumoStop,
} from '../../../../store/editor-store.types';
export interface CarPath {
  x: number;
  y: number;
  z: number;
  model?: string;
  color?: number;
  scale?: number;
  rotation?: number;
  selected?: boolean;
  speed?: number;
  sumo_depart?: number;
  sumo_depart_lane?: string;
  sumo_depart_pos?: number;
  sumo_max_speed?: number;
  sumo_edges?: string;
  sumo_vtype?: string;
  sumo_stop?: SumoStop;
  points?: Pick<Point, 'x' | 'y' | 'z'>[];
  lidars?: Omit<Lidar, 'id' | 'carId'>[];
}

export interface RSUPath {
  x: number;
  y: number;
  z: number;
  tx_power?: number;
  frequency?: number;
  range?: number;
  protocol?: string;
  scenario?: string | null;
  beacon_interval?: number;
  opencda_name?: string;
  opencda_id?: number;
  opencda_color?: [number, number, number];
  opencda_behavior_services?: RsuBehaviorService[];
  opencda_perception_activate?: boolean;
  opencda_detection_range?: number;
  opencda_camera_visualize?: number;
  opencda_camera_num?: number;
  opencda_camera_positions?: [number, number, number, number][];
  opencda_lidar_visualize?: boolean;
  opencda_lidar_channels?: number;
  opencda_lidar_range?: number;
  opencda_lidar_points_per_second?: number;
  opencda_lidar_rotation_frequency?: number;
  opencda_lidar_upper_fov?: number;
  opencda_lidar_lower_fov?: number;
  opencda_lidar_dropoff_general_rate?: number;
  opencda_lidar_dropoff_intensity_limit?: number;
  opencda_lidar_dropoff_zero_intensity?: number;
  opencda_lidar_noise_stddev?: number;
  opencda_localization_activate?: boolean;
  opencda_gnss_noise_alt_stddev?: number;
  opencda_gnss_noise_lat_stddev?: number;
  opencda_gnss_noise_lon_stddev?: number;
}

export interface BuildingPath {
  id?: string;
  x: number;
  y: number;
  z: number;
  height?: number;
  material?: string;
  scale?: number;
  rotation?: number;
}

export interface PedestrianPath {
  id?: string;
  x: number;
  y: number;
  z: number;
  speed?: number;
  cross_factor?: number;
  is_invincible?: boolean;
  tx_power?: number;
  frequency?: number;
  protocol?: string;
  beacon_interval?: number;
}

export interface ScenarioGroup<T> {
  vehicle: string;
  path: T[];
}
export const textAreaStyles = `{
            boxSizing: 'border-box',
            width: '100%',
            minHeight: '80px',
            resize: 'vertical',
            maxWidth: '100%',

            background: 'rgba(105,240,174,0.03)',
            border: '1px solid rgba(105,240,174,0.15)',
            outline: 'none',
            color: 'rgba(30, 0, 255, 0.75)',
            fontFamily: '"Courier New", Courier, monospace',
            fontSize: '10px',
            letterSpacing: '0.06em',
            lineHeight: '1.6',
            padding: '10px 12px',

            transition: 'border-color 0.2s ease, background 0.2s ease',
          }}
          onFocus={e => {
            e.target.style.borderColor = 'rgba(105,240,174,0.45)';
            e.target.style.background  = 'rgba(105,240,174,0.06)';
          }}
          onBlur={e => {
            e.target.style.borderColor = 'rgba(105,240,174,0.15)';
            e.target.style.background  = 'rgba(105,240,174,0.03)';
}`;
