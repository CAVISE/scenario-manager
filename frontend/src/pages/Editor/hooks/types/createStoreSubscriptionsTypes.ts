import * as THREE from 'three';
export interface CreateStoreSubscriptionsOptions {
  sceneRef:          React.MutableRefObject<THREE.Scene | undefined>;
  buildingModelRef:  React.MutableRefObject<THREE.Object3D | null>;
  getIsDragging:     () => boolean;
  loadRSU:           () => void;
  loadPoints:        () => void;
  updateSceneGraph:  () => void;
}