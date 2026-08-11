import { type SimulationConfig } from '../../pages/Editor/Generators/types/configGeneratorsTypes';
import {
  Vec3,
  type SelectedObject,
} from '../../pages/Editor/types/editorTypes';

export type V2XProtocol = 'ITS-G5' | 'C-V2X' | 'DSRC';
export type BuildingMaterial =
  'concrete' | 'glass' | 'wood' | 'brick' | 'metal';
export type AntennaType = 'isotropic' | 'dipole' | 'tr38901' | 'planar_array';
export type Polarization = 'vertical' | 'horizontal' | 'cross';
export type NetworkProtocol = 'GeoNetworking' | 'BTP' | 'IPv4' | 'IPv6';
export type CarlaWeather =
  | 'CloudyNoon'
  | 'ClearNoon'
  | 'CloudyNoon'
  | 'WetNoon'
  | 'WetCloudyNoon'
  | 'SoftRainNoon'
  | 'MidRainyNoon'
  | 'HardRainNoon'
  | 'ClearSunset'
  | 'CloudySunset'
  | 'WetSunset'
  | 'WetCloudySunset'
  | 'SoftRainSunset'
  | 'MidRainSunset'
  | 'HardRainSunset';

export type RouteNode = Vec3[][];

export type Scenario = {
  id: string;
  name: string;
  weather: string;
  description: string;
  file_: string | null;
};
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

export type CavBehaviorService =
  SelfInformerService | AIMClientService | MovementControllerService;

export type RsuBehaviorService = AIMServerService;

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
export type Pedestrian = {
  id: string;
  x: number;
  y: number;
  z: number;
  speed: number;
  cross_factor: number;
  is_invincible: boolean;
  tx_power: number;
  frequency: number;
  protocol: 'DSRC' | 'C-V2X';
  beacon_interval: number;
};
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

export type Point = {
  id: string;
  carId: string;
  x: number;
  y: number;
  z: number;
};

export type Building = {
  id: string;
  name: string;
  x: number;
  y: number;
  z: number;
  width: number;
  depth: number;
  height: number;
  scale: number;
  rotation: number;
  material: BuildingMaterial;
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

export type DeletedEntity =
  | { kind: 'car'; index: number; car: Car; points: Point[]; lidars: Lidar[] }
  | { kind: 'rsu'; index: number; rsu: RSU }
  | { kind: 'building'; index: number; building: Building }
  | { kind: 'pedestrian'; index: number; pedestrian: Pedestrian }
  | { kind: 'lidar'; index: number; lidar: Lidar }
  | { kind: 'point'; index: number; point: Point };

export type DeletionSnapshot = {
  snapshotId: string;
  deletedAt: number;
  origin: 'single-delete' | 'clear-scene';
  label: string;
  entities: DeletedEntity[];
};

export type EditorState = {
  cars: Car[];
  RSUs: RSU[];
  lidars: Lidar[];
  points: Point[];
  buildings: Building[];
  error: Error | null;
  selectedId: string | null;
  isBuildingMode: boolean;
  routes: RouteNode;
  simConfig: SimulationConfig;
  Scenario: Scenario;
  pedestrians: Pedestrian[];
  isPanelOpen: boolean;
  setError: (err: Error | null) => void;
  setChangePanelMode: () => void;
  setBuildingMode: (value: boolean) => void;
  removeSelectedId: () => void;
  selectedObject: SelectedObject | null;
  updateSimConfig: (props: Partial<SimulationConfig>) => void;
  updateSimConfigOmnet: (props: Partial<SimulationConfig['omnet']>) => void;
  updateSimConfigArtery: (props: Partial<SimulationConfig['artery']>) => void;
  updateSimConfigSionna: (props: Partial<SimulationConfig['sionna']>) => void;
  updateSimConfigCarla: (props: Partial<SimulationConfig['carla']>) => void;
  updateSimConfigOpenCDA: (props: Partial<SimulationConfig['opencda']>) => void;
  updateSimConfigSumo: (props: Partial<SimulationConfig['sumo']>) => void;
  updateSimConfigCAPI: (props: Partial<SimulationConfig['capi']>) => void;
  updateSimConfigMPC: (props: Partial<SimulationConfig['mpc']>) => void;

  addCar: (
    x: number,
    y: number,
    z: number,
    model: string,
    color: string,
    speed?: number,
  ) => string;
  updateCar: (id: string, props: Partial<Omit<Car, 'id'>>) => void;
  removeCar: (id: string) => void;
  addPedestrian: (x: number, y: number, z: number) => string;
  updatePedestrian: (
    id: string,
    props: Partial<Omit<Pedestrian, 'id'>>,
  ) => void;
  removePedestrian: (id: string) => void;
  addRSU: (x: number, y: number, z: number) => string;
  removeRSU: (index: number) => void;
  removeAllRSUs: () => void;
  updateRSU: (id: string, props: Partial<Omit<RSU, 'id'>>) => void;

  addLidar: (carId: string, x: number, y: number, z: number) => string;
  updateLidar: (
    id: string,
    props: Partial<Omit<Lidar, 'id' | 'carId'>>,
  ) => void;
  removeLidar: (id: string) => void;
  removeLidarsByCarId: (carId: string) => void;

  updateScenario: (props: Partial<Scenario>) => void;
  addPoint: (carId: string, x: number, y: number, z: number) => string;
  removePoint: (id: string) => void;
  removePointsByCarId: (carId: string) => void;
  updatePoint: (
    id: string,
    props: Partial<Omit<Point, 'id' | 'carId'>>,
  ) => void;

  selectObject: (obj: SelectedObject | null) => void;
  addBuilding: (x: number, y: number, z: number) => string;
  updateBuilding: (id: string, props: Partial<Omit<Building, 'id'>>) => void;
  removeBuilding: (id: string) => void;

  deletionHistory: DeletionSnapshot[];
  pushDeletionSnapshot: (
    snapshot: Omit<DeletionSnapshot, 'snapshotId' | 'deletedAt'>,
  ) => string;
  restoreLastDeletion: (snapshotId?: string) => boolean;
  clearDeletionHistory: () => void;
};
