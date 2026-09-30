import type { Lidar, SumoStop } from '@/entities/vehicle';

export interface CarScenarioPath {
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
  points?: { id: number; x: number; y: number; z: number }[];
  lidars?: Omit<Lidar, 'id' | 'carId'>[];
}

export interface RSUScenarioPath {
  id?: string;
  name?: string;
  x: number;
  y: number;
  z: number;
  tx_power?: number;
  frequency?: number;
  range?: number;
  protocol?: string;
  network_protocol?: string;
  scenario?: string | null;
  antenna_type?: string;
  antenna_height?: number;
  antenna_gain?: number;
  polarization?: string;
  mimo_rows?: number;
  mimo_columns?: number;
  element_spacing?: number;
  azimuth?: number;
  tilt?: number;
  cam_interval?: number;
}

export interface BuildingScenarioPath {
  id?: string;
  x: number;
  y: number;
  z: number;
  height?: number;
  material?: string;
  scale?: number;
  rotation?: number;
}

export interface PedestrianScenarioPath {
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

export interface BaseScenarioGroup {
  preview?: string | null;
}

export type ScenarioGroup =
  | (BaseScenarioGroup & { vehicle: 'car'; path: CarScenarioPath[] })
  | (BaseScenarioGroup & { vehicle: 'RSU'; path: RSUScenarioPath[] })
  | (BaseScenarioGroup & { vehicle: 'building'; path: BuildingScenarioPath[] })
  | (BaseScenarioGroup & {
      vehicle: 'pedestrian';
      path: PedestrianScenarioPath[];
    });

export interface ScenarioStoredJson {
  scenario_text: ScenarioGroup[];
}

export interface ScenarioPayload {
  scenario_name?: string | null;
  scenario_id: string | null;
  name_of_scenario: string | null;
  description?: string | null;
  preview?: string | null;
  scenario: ScenarioGroup[] | ScenarioStoredJson;
  file_: string | null;
  weather?: string | undefined;
  map?: string | null;
  explicit_clear?: boolean;
  revision?: number;
  id?: string | null;
}

export interface ScenarioDetail {
  scenario_id: string;
  revision?: number;
  name_of_scenario: string | null;
  scenario_name?: string | null;
  weather?: string | null;
  description?: string | null;
  preview?: string | null;
  file_?: string | null;
  map?: string | null;
  scenario?: ScenarioGroup[] | ScenarioStoredJson | null;
}

export interface ScenarioListItem {
  id: number;
  scenario_id: string;
  name: string;
  preview: string | null;
  annotation: string | null;
}

export interface ScenarioPageResponse {
  items: ScenarioListItem[];
  total: number;
  offset: number;
  limit: number;
}

export interface ScenarioMutationResponse {
  status: string;
  message: string;
  scenario_id?: string | null;
  revision?: number | null;
  warning?: string | null;
}

export interface ScenarioApiDetail {
  id: number;
  scenario_id: string;
  revision: number;
  name_of_scenario: string | null;
  scenario_text?: ScenarioGroup[] | Record<string, unknown> | null;
  preview?: string | null;
  annotation?: string | null;
  file_?: string | null;
  map?: string | null;
}

export type ValidationResult = { ok: true } | { ok: false; message: string };

export type ValidationIssue = {
  msg?: string;
  loc?: (string | number)[];
};

export type ApiErrorPayload =
  | {
      detail?: string | ValidationIssue[];
      message?: string;
      error?: string;
    }
  | string
  | null
  | undefined;
