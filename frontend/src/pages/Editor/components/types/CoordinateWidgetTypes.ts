import * as THREE from 'three';
export interface CoordinatesWidgetProps {
  getCameraRef: () => THREE.PerspectiveCamera | undefined;
  getRoadMesh:  () => THREE.Mesh | null;
}

export const GROUND_PLANE = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
