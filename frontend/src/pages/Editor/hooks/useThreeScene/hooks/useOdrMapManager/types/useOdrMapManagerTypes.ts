import {
  LOADING_STEPS,
  OpenDriveMapInstance,
} from '../../../../../types/editorTypes';
import {
  OdrMapMeshes,
  OpenDriveModule,
} from '../../../../useOpenDriveUtils/useOdrMap/types/useOdrMapTypes';
import * as THREE from 'three';
import { ODR_MAP_OPTIONS } from '../../useOdrLoader/types/useOdrLoaderTypes';

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

export interface UseOdrMapManagerProps {
  setStep: (step: keyof typeof LOADING_STEPS) => void;
  setError: ((err: Error) => void) | undefined;
  loadRSU: () => void;
  loadPoints: () => void;
  syncRoadMesh: (mesh: THREE.Mesh | null) => void;
  updateSceneGraph: () => void;
  buildingModelRef: React.RefObject<THREE.Object3D | null>;
  buildingMeshesRef: React.RefObject<THREE.Object3D[]>;
  localLineArrRef: React.RefObject<THREE.Line[][]>;
  moduleRef: React.RefObject<OpenDriveModule | null>;
  mapRef: React.RefObject<OpenDriveMapInstance | null>;
  odrMapOptions: typeof ODR_MAP_OPTIONS;
}

export interface UseOdrMapManagerResult {
  getOdrMeshes: () => OdrMapMeshes;
  loadOdrMap: (clearMap?: boolean, fitView?: boolean) => void;
  reloadOdrMap: () => void;
}
