import { Lidar } from "../../store/types/useEditorStoreTypes";

export interface CarScenarioPath {
  x: number; y: number; z: number;
  model?: string;
  color?: number;
  scale?: number;
  rotation?: number;
  selected?: boolean;
  speed?: number;
  points?: { id: number; x: number; y: number; z: number }[];
  lidars?: Omit<Lidar, 'id' | 'carId'>[];
}

export interface RSUScenarioPath {
  id?: string; name?: string;
  x: number; y: number; z: number;
  tx_power?: number; frequency?: number; range?: number;
  protocol?: string; network_protocol?: string;
  script?: string | null;
  antenna_type?: string; antenna_height?: number; antenna_gain?: number;
  polarization?: string; mimo_rows?: number; mimo_columns?: number;
  element_spacing?: number; azimuth?: number; tilt?: number; cam_interval?: number;
}

export interface BuildingScenarioPath {
  id?: string;
  x: number; y: number; z: number;
  height?: number; material?: string;
  scale?: number; rotation?: number;
}

export interface PedestrianScenarioPath {
  id?: string;
  x: number; y: number; z: number;
  speed?: number; cross_factor?: number; is_invincible?: boolean;
  tx_power?: number; frequency?: number;
  protocol?: string; beacon_interval?: number;
}

export interface BaseScenarioGroup {
  preview?: string | null;
}

export type ScenarioGroup =
  | (BaseScenarioGroup & { vehicle: 'car'; path: CarScenarioPath[] })
  | (BaseScenarioGroup & { vehicle: 'RSU'; path: RSUScenarioPath[] })
  | (BaseScenarioGroup & { vehicle: 'building'; path: BuildingScenarioPath[] })
  | (BaseScenarioGroup & { vehicle: 'pedestrian'; path: PedestrianScenarioPath[] });

export interface ScenarioPayload {
  id: string | null;
  name_of_scenario: string | null;
  scenario_id: string | null;
  scenario_name: string | null;
  weather: string | null;
  preview?: string | null;
  scenario: ScenarioGroup[];
  map?: string;
}

export interface ScenarioListItem {
  id: number;
  scenario_id: string;
  name: string;
  preview: string | null;
  annotation: string | null;
}

export interface LoadAllScenariosResponse {
  status: string;
  count: number;
  scenarios: ScenarioListItem[];
}
