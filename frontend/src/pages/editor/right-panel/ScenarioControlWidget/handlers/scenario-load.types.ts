import * as THREE from 'three';
import type { LOADING_STEPS } from '../../../editor.types';

export interface LoadScenarioOptions {
  hasId: boolean;
  scenarioIdInput: string;
  sceneRef: React.RefObject<THREE.Scene | undefined>;
  setNotice: (value: string) => void;
  loadRSURef: React.RefObject<() => void>;
  updateSceneGraph: () => void;
  buildingModelRef: React.RefObject<THREE.Object3D | null>;
  loadFile: (fileContent: string, x: boolean) => void;
  setStep?: (step: keyof typeof LOADING_STEPS) => void;
}
