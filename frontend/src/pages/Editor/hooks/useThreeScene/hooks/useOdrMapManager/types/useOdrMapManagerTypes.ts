import type { MutableRefObject } from 'react';

import * as THREE from 'three';
import { LOADING_STEPS, OpenDriveMapInstance } from '@editor/types/editorTypes';
import {
  OdrMapMeshes,
  OpenDriveModule,
} from '@editor/hooks/useOpenDriveUtils/useOdrMap/types/useOdrMapTypes';

export const EMPTY_ODR_MESHES: OdrMapMeshes = {
  refline_lines: null,
  road_network_mesh: null,
  roadmarks_mesh: null,
  lane_outline_lines: null,
  roadmark_outline_lines: null,
  ground_grid: null,
};

export const ODR_PARAMS = {
  resolution: 0.3,
  ref_line: true,
  roadmarks: true,
  view_mode: 'Default',
};

export const ODR_MAP_OPTIONS = {
  with_lateralProfile: true,
  with_laneHeight: true,
  with_road_objects: false,
  center_map: true,
  abs_z_for_for_local_road_obj_outline: true,
} as const;

export interface UseOdrMapManagerProps {
  setStep: (step: keyof typeof LOADING_STEPS) => void;
  setError: ((err: Error) => void) | undefined;
  loadPoints: () => void;
  syncRoadMesh: (mesh: THREE.Mesh | null) => void;
  updateSceneGraph: () => void;
  buildingMeshesRef: MutableRefObject<THREE.Object3D[]>;
  localLineArrRef: MutableRefObject<THREE.Line[][]>;
}

export interface UseOdrMapManagerResult {
  getOdrMeshes: () => OdrMapMeshes;
  loadOdrMap: (clearMap?: boolean, fitView?: boolean) => void;
  reloadOdrMap: () => void;
  setModuleRef: MutableRefObject<OpenDriveModule | null>;
  setMapRef: MutableRefObject<OpenDriveMapInstance | null>;
}
