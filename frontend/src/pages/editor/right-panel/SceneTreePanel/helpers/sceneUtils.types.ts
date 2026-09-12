import * as THREE from 'three';
export interface findObjectInSceneProps {
  sceneRef: React.RefObject<THREE.Scene | undefined>;
  itemId: string;
}
