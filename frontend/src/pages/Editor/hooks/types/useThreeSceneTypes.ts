import type * as THREE from 'three';
import type { LOADING_STEPS } from '../../types/editorTypes';
export let localLineArr: THREE.Line[][] = [];

export interface UseThreeSceneOptions {
  buildingModelRef: React.MutableRefObject<THREE.Object3D | null>;
  setStep:             (step: keyof typeof LOADING_STEPS) => void;
  updateSceneGraph:    () => void;
}

export interface UseThreeSceneResult {
  actionsRef: React.MutableRefObject<{
    addCube:    () => void;
    addRSU:     () => void;
    addPoints:  () => void;
    deleteCar:  () => void;
    deleteCube: () => void;
    addPedestrian: ()=>void
  }>;
}
export const PARAMS = {
      resolution: 0.3, ref_line: true, roadmarks: true, wireframe: false,
      spotlight: true, lateralProfile: true, laneHeight: true, view_mode: 'Default',
};