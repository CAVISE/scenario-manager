import * as THREE from 'three';
export interface RestoreLidarsOptions {
  carMeshesRef:    React.MutableRefObject<THREE.Mesh[]>;
  updateSceneGraph: () => void;
}