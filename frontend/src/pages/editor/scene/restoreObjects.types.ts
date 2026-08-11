import * as THREE from 'three';
export interface RestoreObjectsOptions {
  scene: THREE.Scene;
  buildingModelRef: React.RefObject<THREE.Object3D | null>;
  loadRSU: () => void;
  updateSceneGraph: () => void;
}
