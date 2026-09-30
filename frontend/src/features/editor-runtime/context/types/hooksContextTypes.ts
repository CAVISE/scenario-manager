import type { SceneNode } from '@right-panel/types/PanelTypes';
import type { MutableRefObject } from 'react';
import * as THREE from 'three';
import { LOADING_STEPS } from '../../constants/editorConstants';

export interface hooksContextTypes {
  buildingModelRef: React.RefObject<THREE.Object3D | null>;
  updateSceneGraph: () => void;
  sceneGraph: SceneNode | null;
  loadingProgress: number;
  loadingText: string | null;
  setStep: (step: keyof typeof LOADING_STEPS) => void;
  actionsRef: MutableRefObject<{
    addCar: () => void;
    addRSU: () => void;
    startRoutePointPlacement: () => void;
    deleteCar: () => void;
    addPedestrian: () => void;
  }>;
  handleAddCar: () => void;
  handleAddRSU: () => void;
  handleAddPedestrian: () => void;
  handleStartRoutePointPlacement: () => void;
  detachTransformControls: () => void;
  handleSetBuildingMode: (value: boolean) => void;
  loadFile: (text: string, clearMap: boolean) => void;
}
