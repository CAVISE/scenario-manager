import * as THREE from 'three';
import type { MutableRefObject } from 'react';
import { OdrMapMeshes } from '../useOdrMap.types';

export interface CreateEditorActionsOptions {
  modeRef: MutableRefObject<{
    isAddCarModeActive: boolean;
    isAddPointModeActive: boolean;
    isAddPedestrianModeActive: boolean;
    isAddedPoints: boolean;
  }>;
  carMeshesRef: MutableRefObject<THREE.Mesh[]>;
  cubeCirclesRef: MutableRefObject<THREE.Mesh[][]>;
  currentCarRef: MutableRefObject<string>;
  currentColorRef: MutableRefObject<string>;
  transformControls: { detach: () => void; parent?: THREE.Object3D | null };
  localLineArrRef: MutableRefObject<THREE.Line[][]>;
  camera: THREE.PerspectiveCamera;
  controls: { update?: () => void };
  getOdrMeshes: () => OdrMapMeshes;

  loadPoints: () => void;
  loadFile: (text: string, clearMap: boolean) => void;
  reloadOdrMap: () => void;
}
