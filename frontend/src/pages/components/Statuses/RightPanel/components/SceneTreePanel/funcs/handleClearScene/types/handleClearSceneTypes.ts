import { TransformControls } from "three-stdlib";
import * as THREE from 'three';
export interface handleClearSceneProps {
  carMeshesRef: React.MutableRefObject<THREE.Mesh[]>
  sceneRef: React.MutableRefObject<THREE.Scene | undefined>;
  cubeCirclesRef: React.MutableRefObject<THREE.Mesh[][]>
  pointsArrRef: React.MutableRefObject<THREE.Mesh[]>
  transformControlsRef: React.MutableRefObject<TransformControls | null>;
  onDetach: () => void
}