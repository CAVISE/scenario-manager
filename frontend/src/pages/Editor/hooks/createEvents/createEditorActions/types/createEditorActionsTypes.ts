import * as THREE from 'three';
import { OdrMapMeshes } from '../../../useOpenDriveUtils/useOdrMap/types/useOdrMapTypes';

export interface CreateEditorActionsOptions {
  modeRef: React.RefObject<{
    isAddCarModeActive: boolean;
    isAddPointModeActive: boolean;
    isAddPedestrianModeActive: boolean;
    isAddedPoints: boolean;
  }>;
  carMeshesRef: React.RefObject<THREE.Mesh[]>;
  cubeCirclesRef: React.RefObject<THREE.Mesh[][]>;
  currentCarRef: React.RefObject<string>;
  currentColorRef: React.RefObject<string>;
  transformControls: { detach: () => void; parent?: THREE.Object3D | null };
  localLineArrRef: React.RefObject<THREE.Line[][]>;
  camera: THREE.PerspectiveCamera;
  controls: { update?: () => void };
  getOdrMeshes: () => OdrMapMeshes;

  loadPoints: () => void;
  loadFile: (text: string, clearMap: boolean) => void;
  reloadOdrMap: () => void;
}
