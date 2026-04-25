import { TransformControls } from 'three-stdlib';

export interface UseEditorHandlersProps {
  actionsRef: React.RefObject<{
    addCube: () => void;
    addRSU: () => void;
    addPoints: () => void;
    addPedestrian: () => void;
    deleteCube: () => void;
  }>;
  currentCarRef: React.RefObject<string>;
  modeRef: React.RefObject<{
    isAddCarModeActive: boolean;
    isAddPointModeActive: boolean;
    isAddPedestrianModeActive: boolean;
    isAddedPoints: boolean;
  }>;
  transformControlsRef: React.RefObject<TransformControls | null>;
}
