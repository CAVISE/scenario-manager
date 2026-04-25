import { TransformControls } from 'three-stdlib';

export interface UseEditorHandlersProps {
  actionsRef: React.MutableRefObject<{
    addCube: () => void;
    addRSU: () => void;
    addPoints: () => void;
    addPedestrian: () => void;
    deleteCube: () => void;
  }>;
  currentCarRef: React.MutableRefObject<string>;
  modeRef: React.MutableRefObject<{
    isAddCarModeActive: boolean;
    isAddPointModeActive: boolean;
    isAddPedestrianModeActive: boolean;
    isAddedPoints: boolean;
  }>;
  transformControlsRef: React.MutableRefObject<TransformControls | null>;
}
