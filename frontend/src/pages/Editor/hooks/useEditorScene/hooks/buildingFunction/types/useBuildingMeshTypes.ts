import * as THREE from 'three';
import { TransformControls } from 'three-stdlib';
export interface UseBuildingMeshSyncOptions {
  sceneRef: React.RefObject<THREE.Scene | undefined>;
  buildingMeshesRef: React.RefObject<THREE.Mesh[]>;
  transformControlsRef: React.RefObject<TransformControls | null>;
  updateSceneGraph: () => void;
}
