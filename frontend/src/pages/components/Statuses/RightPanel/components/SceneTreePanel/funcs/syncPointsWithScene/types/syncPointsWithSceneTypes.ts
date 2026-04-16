import * as THREE from 'three';
export interface syncPointsWithSceneProps {
  pointsArrRef: React.MutableRefObject<THREE.Mesh[]>
  sceneRef: React.MutableRefObject<THREE.Scene | undefined>;
}