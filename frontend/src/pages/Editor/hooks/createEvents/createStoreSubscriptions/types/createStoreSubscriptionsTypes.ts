import * as THREE from 'three';
export interface CreateStoreSubscriptionsOptions {
  sceneRef: React.RefObject<THREE.Scene | undefined>;
  buildingModelRef: React.RefObject<THREE.Object3D | null>;
  getIsDragging: () => boolean;
  loadRSU: () => void;
  loadPoints: () => void;
  updateSceneGraph: () => void;
}
