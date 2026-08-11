import type { MutableRefObject } from 'react';
import * as THREE from 'three';
import { LOADING_STEPS } from '../editor.types';
import { SceneNode } from '../hooks/useSceneGraph.types';
export interface hooksContextTypes {
  buildingModelRef: React.RefObject<THREE.Object3D | null>;
  updateSceneGraph: () => void;
  sceneGraph: SceneNode | null;
  loadingProgress: number;
  loadingText: string | null;
  setStep: (step: keyof typeof LOADING_STEPS) => void;
  actionsRef: MutableRefObject<{
    addCube: () => void;
    addRSU: () => void;
    addPoints: () => void;
    deleteCar: () => void;
    deleteCube: () => void;
    addPedestrian: () => void;
  }>;
  handleAddCube: () => void;
  handleAddRSU: () => void;
  handleAddPedestrian: () => void;
  handleAddPoints: () => void;
  detachTransformControls: () => void;
  handleSetBuildingMode: (value: boolean) => void;
  loadFile: (text: string, clearMap: boolean) => void;
}
