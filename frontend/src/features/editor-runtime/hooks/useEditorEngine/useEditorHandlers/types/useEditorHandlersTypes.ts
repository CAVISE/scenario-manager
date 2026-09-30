import type { MutableRefObject } from 'react';
import { TransformControls } from 'three-stdlib';

export interface UseEditorHandlersProps {
  actionsRef: MutableRefObject<{
    addCar: () => void;
    addRSU: () => void;
    startRoutePointPlacement: () => void;
    addPedestrian: () => void;
    deleteCar: () => void;
  }>;
  currentCarRef: MutableRefObject<string>;
  modeRef: MutableRefObject<{
    isAddCarModeActive: boolean;
    isAddPointModeActive: boolean;
    isAddPedestrianModeActive: boolean;
    isAddedPoints: boolean;
  }>;
  transformControlsRef: MutableRefObject<TransformControls | null>;
}
