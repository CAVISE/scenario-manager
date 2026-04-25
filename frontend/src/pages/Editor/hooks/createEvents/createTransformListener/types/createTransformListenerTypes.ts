import * as THREE from 'three';

export interface CreateTransformListenerOptions {
  transformControls: {
    addEventListener: (event: never, cb: () => void) => void;
    removeEventListener: (event: never, cb: () => void) => void;
  };
  carMeshesRef: React.RefObject<THREE.Mesh[]>;
  cubeCirclesRef: React.RefObject<THREE.Mesh[][]>;
  carQuaternionsRef: React.RefObject<Map<string, THREE.Quaternion>>;
}
