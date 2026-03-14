import type { CarlaWeather, Car, RSU, Building } from "../../../store/useEditorStore";
export const LOADING_STEPS = {
  init:  { text: 'Initializing editor…',  pct: 5   },
  wasm:  { text: 'Loading WebAssembly…',  pct: 33  },
  map:   { text: 'Parsing road network…', pct: 66  },
  scene: { text: 'Building scene…',       pct: 90  },
  done:  { text: null,                    pct: 100 },
} as const;
export type Vec3 = { x: number; y: number; z: number };

export interface SelectedObject {
  type:      'rsu' | 'point' | 'building' | 'circle' | 'lidar' | 'car';
  id?:       string;
  position?: Vec3;
}

export interface OdrMapConfig {
  with_lateralProfile:                  boolean;
  with_laneHeight:                      boolean;
  with_road_objects:                    boolean;
  center_map:                           boolean;
  abs_z_for_for_local_road_obj_outline: boolean;
}

export interface ScenarioCoordinate {
  x:         number;
  y:         number;
  z:         number;
  color?:    number;
  rotation?: number;
  scale?:    number;
  points?:   Vec3[];
  speed:     number;
  model?:    string;
}

export interface CarScenario {
  vehicle: string;
  path:    Car[];
}

export interface RSUScenario {
  vehicle: 'RSU';
  path:    RSU[];
  active?: boolean;
  color?:  { r: number; g: number; b: number };
}

export interface BuildingScenario {
  vehicle: 'building';
  path:    Building[];
}

export interface ScenarioSettings {
  scenario_id:   string;
  scenario_name: string;
  vehicle:       string;
  weather:       CarlaWeather;
  arr_car:       string[];
  color_arr:     number[];
  scenario:      Array<CarScenario | RSUScenario | BuildingScenario>;
}

export interface OpenDriveMapInstance {
  delete():  void;
  x_offs:    number;
  y_offs:    number;
}

export interface OdrRoadNetworkMesh {
  lanes_mesh:     import("../scene/types/sceneHelpersTypes").OdrLanesMesh;
  roadmarks_mesh: import("../scene/types/sceneHelpersTypes").OdrRoadmarksMesh;
}

interface LibOpenDriveGlobal {
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

function getGlobalLibOpenDrive(): LibOpenDriveGlobal | undefined {
  const g = globalThis as Record<string, unknown>;
  if (typeof g['libOpenDrive'] === 'function') {
    return g['libOpenDrive'] as LibOpenDriveGlobal;
  }
  return undefined;
}

export function libOpenDrive(): Promise<unknown> {
  const fn = getGlobalLibOpenDrive();
  if (fn) return fn();

  return new Promise((resolve, reject) => {
    let attempts = 0;
    const interval = setInterval(() => {
      const found = getGlobalLibOpenDrive();
      if (found) {
        clearInterval(interval);
        resolve(found());
        return;
      }
      if (++attempts >= 100) {
        clearInterval(interval);
        reject(new Error(
          'libOpenDrive not available. Make sure ModuleOpenDrive.js is loaded via <script> in index.html'
        ));
      }
    }, 50);
  });
}