import * as THREE from 'three';
import { OdrMapMeshes } from '../../../useOpenDriveUtils/useOdrMap/types/useOdrMapTypes';

export interface CreateEditorActionsOptions {
  modeRef: React.MutableRefObject<{
    isAddCarModeActive: boolean;
    isAddPointModeActive: boolean;
    isAddPedestrianModeActive: boolean;
    isAddedPoints: boolean;
  }>;
  carMeshesRef: React.MutableRefObject<THREE.Mesh[]>;
  cubeCirclesRef: React.MutableRefObject<THREE.Mesh[][]>;
  currentCarRef: React.MutableRefObject<string>;
  currentColorRef: React.MutableRefObject<string>;
  transformControls: { detach: () => void; parent?: THREE.Object3D | null };
  localLineArrRef: React.MutableRefObject<THREE.Line[][]>;
  camera: THREE.PerspectiveCamera;
  controls: { update?: () => void };
  getOdrMeshes: () => OdrMapMeshes;

  loadPoints: () => void;
  loadFile: (text: string, clearMap: boolean) => void;
  reloadOdrMap: () => void;
}
