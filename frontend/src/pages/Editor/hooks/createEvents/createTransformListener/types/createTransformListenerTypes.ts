import * as THREE from 'three';

export interface CreateTransformListenerOptions {
  transformControls: {
    addEventListener: (event: never, cb: () => void) => void;
    removeEventListener: (event: never, cb: () => void) => void;
  };
  carMeshesRef: React.MutableRefObject<THREE.Mesh[]>;
  cubeCirclesRef: React.MutableRefObject<THREE.Mesh[][]>;
  carQuaternionsRef: React.MutableRefObject<Map<string, THREE.Quaternion>>;
}
