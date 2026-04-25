import * as THREE from 'three';
import { LOADING_STEPS } from '../../types/editorTypes';
import { SceneNode } from '../../hooks/useEditorEngine/useSceneGraph/types/useSceneGraphTypes';
export interface hooksContextTypes {
  buildingModelRef: React.RefObject<THREE.Object3D | null>;
  updateSceneGraph: () => void;
  sceneGraph: SceneNode | null;
  loadingProgress: number;
  loadingText: string | null;
  setStep: (step: keyof typeof LOADING_STEPS) => void;
  actionsRef: React.RefObject<{
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
}
