import * as THREE from 'three';
export interface findObjectInSceneProps {
  sceneRef: React.MutableRefObject<THREE.Scene | undefined>;
  itemId: string;
}
