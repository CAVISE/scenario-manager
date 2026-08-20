import { LOADING_STEPS } from '@editor/types/editorTypes';
import type { MutableRefObject } from 'react';
import type * as THREE from 'three';
export const localLineArr: THREE.Line[][] = [];
export interface useThreeSceneProps {
  setStep: (step: keyof typeof LOADING_STEPS) => void;
  updateSceneGraph: () => void;
}
export interface UseThreeSceneResult {
  actionsRef: MutableRefObject<{
    addCube: () => void;
    addRSU: () => void;
    addPoints: () => void;
    deleteCar: () => void;
    deleteCube: () => void;
    addPedestrian: () => void;
  }>;
  loadFile: (text: string, clearMap: boolean) => void;
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
