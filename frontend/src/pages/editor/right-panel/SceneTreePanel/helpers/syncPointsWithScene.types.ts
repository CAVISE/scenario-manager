import * as THREE from 'three';
export interface syncPointsWithSceneProps {
  pointsArrRef: React.RefObject<THREE.Mesh[]>;
  sceneRef: React.RefObject<THREE.Scene | undefined>;
}
