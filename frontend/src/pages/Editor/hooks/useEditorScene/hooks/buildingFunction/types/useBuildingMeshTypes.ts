import * as THREE from 'three';
import { TransformControls } from 'three-stdlib';
export interface UseBuildingMeshSyncOptions {
  sceneRef: React.MutableRefObject<THREE.Scene | undefined>;
  buildingMeshesRef: React.MutableRefObject<THREE.Mesh[]>;
  transformControlsRef: React.MutableRefObject<TransformControls | null>;
  updateSceneGraph: () => void;
}
