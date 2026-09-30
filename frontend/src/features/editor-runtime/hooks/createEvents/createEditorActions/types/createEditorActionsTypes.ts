import * as THREE from 'three';
import type { MutableRefObject } from 'react';
import { OdrMapMeshes } from '../../../useOpenDriveUtils/useOdrMap/types/useOdrMapTypes';

export interface ModeRef {
  isAddCarModeActive: boolean;
  isAddPointModeActive: boolean;
  isAddPedestrianModeActive: boolean;
  isAddedPoints: boolean;
}

export type ModeName =
  'CAR' | 'POINT' | 'RSU' | 'PEDESTRIAN' | 'DIRECTION_POINTS';

export interface EditorActions {
  load_file: () => void;
  fitView: () => void;
  reload_map: () => void;
  addCar: () => void;
  addRSU: () => void;
  addPedestrian: () => void;
  startRoutePointPlacement: () => void;
  deleteCar: () => void;
}

export interface CreateEditorActionsOptions {
  modeRef: MutableRefObject<ModeRef>;
  carMeshesRef: MutableRefObject<THREE.Mesh[]>;
  routePointMeshesRef: MutableRefObject<THREE.Mesh[][]>;
  currentCarRef: MutableRefObject<string>;
  currentColorRef: MutableRefObject<string>;
  transformControls: { detach: () => void; parent?: THREE.Object3D | null };
  localLineArrRef: MutableRefObject<THREE.Line[][]>;
  camera: THREE.PerspectiveCamera;
  controls: { update?: () => void };
  getOdrMeshes: () => OdrMapMeshes;

  syncRoutePointMeshes: () => void;
  loadFile: (text: string, clearMap: boolean, sourceName?: string) => void;
  reloadOdrMap: () => void;
}
