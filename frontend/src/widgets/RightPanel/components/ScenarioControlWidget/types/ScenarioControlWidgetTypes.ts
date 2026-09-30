import type { Lidar, Point, SumoStop } from '@/entities/vehicle';
import type { RsuBehaviorService } from '@/entities/roadside-unit';
import type { ScenarioPreflightResult } from '@/api/types/simulationTypes';

export type ScenarioOperation = 'save' | 'delete' | 'run' | 'validate';

export interface ScenarioControls {
  notice: string;
  operation: ScenarioOperation | null;
  isBusy: boolean;
  preflight: ScenarioPreflightResult | null;
  save: () => Promise<void>;
  remove: () => Promise<void>;
  run: () => Promise<void>;
  validate: () => Promise<void>;
}

export interface ScenarioControlWidgetProps {
  controls: ScenarioControls;
  readOnly?: boolean;
  onOpenSimulation: () => void;
  onOpenResults: () => void;
  onOpenSettings: () => void;
}
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
