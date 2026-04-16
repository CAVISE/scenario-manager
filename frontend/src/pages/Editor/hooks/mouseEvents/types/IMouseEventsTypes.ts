import * as THREE from 'three';
export interface SharedMouseContext {
  mouse: THREE.Vector2;
  raycaster: THREE.Raycaster;
  setMouse: (e: MouseEvent) => void;
  insidePanel: (e: MouseEvent) => boolean;
}
export interface UseMouseEventsOptions {

  updateSceneGraph: () => void;


  buildingModelRef: React.MutableRefObject<THREE.Object3D | null>;

  onDeleteCube:     () => void;
 
}
