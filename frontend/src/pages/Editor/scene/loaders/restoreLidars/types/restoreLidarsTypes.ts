import * as THREE from 'three';
export interface RestoreLidarsOptions {
  carMeshesRef: React.RefObject<THREE.Mesh[]>;
  updateSceneGraph: () => void;
}
