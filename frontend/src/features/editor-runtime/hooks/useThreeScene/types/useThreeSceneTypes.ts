import { LOADING_STEPS } from '@editor/constants/editorConstants';
import type { MutableRefObject } from 'react';

export interface useThreeSceneProps {
  setStep: (step: keyof typeof LOADING_STEPS) => void;
  updateSceneGraph: () => void;
}
export interface UseThreeSceneResult {
  actionsRef: MutableRefObject<{
    addCar: () => void;
    addRSU: () => void;
    startRoutePointPlacement: () => void;
    deleteCar: () => void;
    addPedestrian: () => void;
  }>;
  loadFile: (text: string, clearMap: boolean) => void;
}
