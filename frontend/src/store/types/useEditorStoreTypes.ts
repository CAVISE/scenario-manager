import { type SimulationConfig } from '../../pages/Editor/Generators/types/configGeneratorsTypes';
import { Vec3 } from '../../pages/Editor/types/editorTypes';

export type V2XProtocol      = 'ITS-G5' | 'C-V2X' | 'DSRC';
export type BuildingMaterial  = 'concrete' | 'glass' | 'wood' | 'brick' | 'metal';
export type AntennaType       = 'isotropic' | 'dipole' | 'tr38901' | 'planar_array';
export type Polarization      = 'vertical' | 'horizontal' | 'cross';
export type NetworkProtocol   = 'GeoNetworking' | 'BTP' | 'IPv4' | 'IPv6';
export type CarlaWeather     = 'CloudyNoon'
  | 'ClearNoon' | 'CloudyNoon' | 'WetNoon' | 'WetCloudyNoon'
  | 'SoftRainNoon' | 'MidRainyNoon' | 'HardRainNoon'
  | 'ClearSunset' | 'CloudySunset' | 'WetSunset' | 'WetCloudySunset'
  | 'SoftRainSunset' | 'MidRainSunset' | 'HardRainSunset';

export type Car = {
  id:       string;
  x:        number;
  y:        number;
  z:        number;
  color:    string;
  model:    string;
  scale:    number;
  rotation: number;
  speed:    number;
};

export type RouteNode = Vec3[][];

export type Scenario = {
  id:      string;
  name:    string;
  weather: string;
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
  script: string;
};

export type Point = {
  id:    string;
  carId: string;
  x:     number;
  y:     number;
  z:     number;
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
  id:                 string;
  carId:              string;
  x:                  number;
  y:                  number;
  z:                  number;
  rotation:           number;
  range:              number;
  channels:           number;
  rotation_frequency: number;
};

export type EditorState = {
  cars:           Car[];
  RSUs:           RSU[];
  lidars:         Lidar[];
  points:         Point[];
  buildings:      Building[];
  selectedId:     string | null;
  isBuildingMode: boolean;
  routes:         RouteNode;
  simConfig:      SimulationConfig;
  Scenario:       Scenario;

  setBuildingMode:       (value: boolean) => void;
  removeSelectedId:      () => void;
  updateSimConfig:       (props: Partial<SimulationConfig>) => void;
  updateSimConfigOmnet:  (props: Partial<SimulationConfig['omnet']>) => void;
  updateSimConfigArtery: (props: Partial<SimulationConfig['artery']>) => void;
  updateSimConfigSionna: (props: Partial<SimulationConfig['sionna']>) => void;
  updateSimConfigCarla:  (props: Partial<SimulationConfig['carla']>) => void;
  updateSimConfigOpenCDA: (props: Partial<SimulationConfig['opencda']>) => void;

  addCar:    (x: number, y: number, z: number, model: string, color: string, speed?: number) => string;
  updateCar: (id: string, props: Partial<Omit<Car, 'id'>>) => void;
  removeCar: (id: string) => void;

  addRSU:    (x: number, y: number, z: number) => void;
  removeRSU: (index: number) => void;
  updateRSU: (id: string, props: Partial<Omit<RSU, 'id'>>) => void;

  addLidar:         (carId: string, x: number, y: number, z: number) => string;
  updateLidar:      (id: string, props: Partial<Omit<Lidar, 'id' | 'carId'>>) => void;
  removeLidar:      (id: string) => void;
  removeLidarsByCarId: (carId: string) => void;

  updateScenario:      (props: Partial<Scenario>) => void;
  addPoint:            (carId: string, x: number, y: number, z: number) => void;
  removePoint:         (id: string) => void;
  removePointsByCarId: (carId: string) => void;
  updatePoint:         (id: string, props: Partial<Omit<Point, 'id' | 'carId'>>) => void;

  selectObject:   (id: string | null) => void;
  addBuilding:    (x: number, y: number, z: number) => void;
  updateBuilding: (id: string, props: Partial<Omit<Building, 'id'>>) => void;
  removeBuilding: (id: string) => void;
};
