import * as THREE from 'three';
export interface LoadScenarioOptions {
  hasId: boolean;
  scenarioIdInput: string;
  sceneRef: React.RefObject<THREE.Scene | undefined>;
  setNotice: (value: string) => void;
  loadRSURef: React.RefObject<() => void>;
  updateSceneGraph: () => void;
  buildingModelRef: React.RefObject<THREE.Object3D | null>;
  loadFile: (fileContent: string, x: boolean) => void;
}
