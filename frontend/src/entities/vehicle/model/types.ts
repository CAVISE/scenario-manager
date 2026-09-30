export type SumoStop = {
  lane: string;
  startPos: number;
  endPos: number;
  duration: number;
};

export type BehaviorServiceType =
  'self_informer' | 'aim_client' | 'movement_controller';

export type SelfInformerService = {
  type: 'self_informer';
};

export type AIMClientService = {
  type: 'aim_client';
  debug?: boolean;
};

export type MovementControllerService = {
  type: 'movement_controller';
};

export type CavBehaviorService =
  SelfInformerService | AIMClientService | MovementControllerService;

export type CavV2X = {
  enabled?: boolean;
  communication_range?: number;
};

export type Car = {
  id: string;
  x: number;
  y: number;
  z: number;
  color: string;
  model: string;
  scale: number;
  rotation: number;
  speed: number;
  opencda_id?: number;
  opencda_carla_model?: string;
  opencda_name?: string;
  opencda_max_speed?: number;
  opencda_ignore_traffic_light?: boolean;
  opencda_overtake_allowed?: boolean;
  opencda_collision_time_ahead?: number;
  opencda_local_planner_debug?: boolean;
  opencda_local_planner_debug_trajectory?: boolean;
  opencda_spawn_special?: number;
  opencda_sensing?: {
    perception_activate?: boolean;
    camera_visualize?: number;
    camera_num?: number;
    lidar_visualize?: boolean;
    lidar_channels?: number;
    lidar_range?: number;
  };
  opencda_color?: [number, number, number];
  opencda_v2x?: CavV2X;
  opencda_behavior_services?: CavBehaviorService[];
  sumo_depart?: number;
  sumo_depart_lane?: string;
  sumo_depart_pos?: number;
  sumo_max_speed?: number;
  sumo_edges?: string;
  sumo_vtype?: string;
  sumo_stop?: SumoStop;
};

export type Point = {
  id: string;
  carId: string;
  x: number;
  y: number;
  z: number;
};

export type Lidar = {
  id: string;
  carId: string;
  x: number;
  y: number;
  z: number;
  rotation: number;
  range: number;
  channels: number;
  rotation_frequency: number;
};

export type CreateCarParams = Pick<
  Car,
  'id' | 'x' | 'y' | 'z' | 'model' | 'color'
> & {
  speed?: number;
};

export type CreateLidarParams = Pick<Lidar, 'id' | 'carId' | 'x' | 'y' | 'z'>;

export type CreatePointParams = Point;
