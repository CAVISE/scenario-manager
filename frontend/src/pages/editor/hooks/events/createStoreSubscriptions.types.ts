import * as THREE from 'three';
import { TransformControls } from 'three-stdlib';
export interface CreateStoreSubscriptionsOptions {
  sceneRef: React.RefObject<THREE.Scene | undefined>;
  buildingModelRef: React.RefObject<THREE.Object3D | null>;
  transformControlsRef: React.RefObject<TransformControls | null>;
  getIsDragging: () => boolean;
  loadRSU: () => void;
  loadPoints: () => void;
  updateSceneGraph: () => void;
}
