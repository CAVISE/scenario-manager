import { LOADING_STEPS } from '@editor/constants/editorConstants';
import type { MutableRefObject } from 'react';

export interface useThreeSceneProps {
  setStep: (step: keyof typeof LOADING_STEPS) => void;
  updateSceneGraph: () => void;
  skipInitialMap: boolean;
}
export interface UseThreeSceneResult {
  runtimeReady: boolean;
  actionsRef: MutableRefObject<{
    addCar: () => void;
    addRSU: () => void;
    startRoutePointPlacement: () => void;
    deleteCar: () => void;
    addPedestrian: () => void;
  }>;
  cancelMapLoad: () => void;
  loadFile: (
    text: string,
    clearMap: boolean,
    sourceName?: string
  ) => Promise<boolean>;
}
