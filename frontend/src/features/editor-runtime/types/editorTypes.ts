import type { CarlaWeather } from '@/entities/scenario';
import type { Car } from '@/entities/vehicle';
import type { Building } from '@/entities/building';
import type { RSU } from '@/entities/roadside-unit';
export type { SelectedObject, Vec3 } from '@/shared/types/sceneTypes';
import type { Vec3 } from '@/shared/types/sceneTypes';

export interface OdrMapConfig {
  with_lateralProfile: boolean;
  with_laneHeight: boolean;
  with_road_objects: boolean;
  center_map: boolean;
  abs_z_for_for_local_road_obj_outline: boolean;
}

export interface ScenarioCoordinate {
  x: number;
  y: number;
  z: number;
  color?: number;
  rotation?: number;
  scale?: number;
  points?: Vec3[];
  speed: number;
  model?: string;
}

export interface CarScenario {
  vehicle: string;
  path: Car[];
}

export interface RSUScenario {
  vehicle: 'RSU';
  path: RSU[];
  active?: boolean;
  color?: { r: number; g: number; b: number };
}

export interface BuildingScenario {
  vehicle: 'building';
  path: Building[];
}

export interface ScenarioSettings {
  scenario_id: string;
  scenario_name: string;
  vehicle: string;
  weather: CarlaWeather;
  arr_car: string[];
  color_arr: number[];
  scenario: Array<CarScenario | RSUScenario | BuildingScenario>;
}

export interface OpenDriveMapInstance {
  delete(): void;
  x_offs: number;
  y_offs: number;
}

export interface OdrRoadNetworkMesh {
  lanes_mesh: import('../scene/utils/sceneHelpers/types/sceneHelpersTypes').OdrLanesMesh;
  roadmarks_mesh: import('../scene/utils/sceneHelpers/types/sceneHelpersTypes').OdrRoadmarksMesh;
}

export interface LibOpenDriveGlobal {
  (): Promise<unknown>;
}

declare global {
  interface Window {
    PARAMS: {
      load_file: () => void;
      [key: string]: unknown;
    };
  }
}
