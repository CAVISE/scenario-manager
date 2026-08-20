import { Lidar, SumoStop } from '@/store/types/useEditorStoreTypes';

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
  id?: string | null;
}

export interface ScenarioDetail {
  scenario_id: string;
  name_of_scenario: string | null;
  scenario_name?: string | null;
  weather?: string | null;
  description?: string | null;
  preview?: string | null;
  file_?: string | null;
  scenario?: ScenarioGroup[] | ScenarioStoredJson | null;
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

export interface ScenarioMutationResponse {
  status: string;
  message: string;
  scenario_id?: string | null;
}

export interface LoadScenarioApiResponse {
  status: string;
  scenario: {
    scenario_id: string;
    name_of_scenario: string | null;
    scenario_text?: ScenarioGroup[] | Record<string, unknown> | null;
    preview?: string | null;
    description?: string | null;
    file_?: string | null;
  };
}

export type ValidationResult = { ok: true } | { ok: false; message: string };

export const SCENARIO_ID_RE = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,127}$/;
export const MAX_NAME_LEN = 200;
export const MAX_DESCRIPTION_LEN = 4000;
export const MAX_PREVIEW_LEN = 10_000_000;
export const MAX_OPENDRIVE_LEN = 32_000_000;
export const ALLOWED_VEHICLES = new Set([
  'car',
  'RSU',
  'building',
  'pedestrian',
]);

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

export function formatApiDetail(
  detail: string | ValidationIssue[] | undefined,
): string | null {
  if (!detail) return null;
  if (typeof detail === 'string' && detail.trim()) return detail;
  if (Array.isArray(detail)) {
    const lines = detail
      .map((issue) => {
        const path = issue.loc
          ?.filter((part: string | number) => part !== 'body')
          .join('.');
        const msg = issue.msg ?? 'Validation error';
        return path ? `${path}: ${msg}` : msg;
      })
      .filter(Boolean);
    return lines.length > 0 ? lines.join('; ') : null;
  }
  return null;
}
