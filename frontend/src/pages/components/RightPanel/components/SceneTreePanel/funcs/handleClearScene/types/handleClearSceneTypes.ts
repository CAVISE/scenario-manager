import { TransformControls } from 'three-stdlib';
import * as THREE from 'three';
export interface handleClearSceneProps {
  carMeshesRef: React.RefObject<THREE.Mesh[]>;
  sceneRef: React.RefObject<THREE.Scene | undefined>;
  cubeCirclesRef: React.RefObject<THREE.Mesh[][]>;
  pointsArrRef: React.RefObject<THREE.Mesh[]>;
  transformControlsRef: React.RefObject<TransformControls | undefined>;
  detachTransformControls: () => void;
}
