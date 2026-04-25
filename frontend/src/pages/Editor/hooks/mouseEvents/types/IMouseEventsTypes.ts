import * as THREE from 'three';
export interface SharedMouseContext {
  mouse: THREE.Vector2;
  raycaster: THREE.Raycaster;
  setMouse: (e: MouseEvent) => void;
  insidePanel: (e: MouseEvent) => boolean;
}
