import {
  LOADING_STEPS,
  OpenDriveMapInstance,
} from '../../../../../types/editorTypes';
import {
  OdrMapMeshes,
  OpenDriveModule,
} from '../../../../useOpenDriveUtils/useOdrMap/types/useOdrMapTypes';
import * as THREE from 'three';
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
  loadRSU: () => void;
  loadPoints: () => void;
  syncRoadMesh: (mesh: THREE.Mesh | null) => void;
  updateSceneGraph: () => void;
  buildingModelRef: React.MutableRefObject<THREE.Object3D | null>;
  localLineArrRef: React.MutableRefObject<THREE.Line[][]>;
}

export interface UseOdrMapManagerResult {
  getOdrMeshes: () => OdrMapMeshes;
  loadOdrMap: (clearMap?: boolean, fitView?: boolean) => void;
  reloadOdrMap: () => void;
  setModuleRef: React.MutableRefObject<OpenDriveModule | null>;
  setMapRef: React.MutableRefObject<OpenDriveMapInstance | null>;
}
