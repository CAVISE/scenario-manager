import type * as THREE from 'three';
import { LOADING_STEPS } from '../../../types/editorTypes';
export const localLineArr: THREE.Line[][] = [];
export interface useThreeSceneProps {
  buildingModelRef: React.RefObject<THREE.Object3D | null>;
  setStep: (step: keyof typeof LOADING_STEPS) => void;
  updateSceneGraph: () => void;
}
export interface UseThreeSceneResult {
  actionsRef: React.RefObject<{
    addCube: () => void;
    addRSU: () => void;
    addPoints: () => void;
    deleteCar: () => void;
    deleteCube: () => void;
    addPedestrian: () => void;
  }>;
}
export const PARAMS = {
  resolution: 0.3,
  ref_line: true,
  roadmarks: true,
  wireframe: false,
  spotlight: true,
  lateralProfile: true,
  laneHeight: true,
  view_mode: 'Default',
};
