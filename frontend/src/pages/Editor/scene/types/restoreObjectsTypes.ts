import * as THREE from 'three';
export interface RestoreObjectsOptions {
  scene:            THREE.Scene;
  buildingModelRef: React.MutableRefObject<THREE.Object3D | null>;
  loadRSU:          () => void;
  updateSceneGraph: () => void;
}
