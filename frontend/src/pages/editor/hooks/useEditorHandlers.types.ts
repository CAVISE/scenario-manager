import type { MutableRefObject } from 'react';
import { TransformControls } from 'three-stdlib';

export interface UseEditorHandlersProps {
  actionsRef: MutableRefObject<{
    addCube: () => void;
    addRSU: () => void;
    addPoints: () => void;
    addPedestrian: () => void;
    deleteCube: () => void;
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
