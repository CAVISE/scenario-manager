import * as THREE from 'three';
import type { MutableRefObject } from 'react';

export interface CreateTransformListenerOptions {
  transformControls: {
    addEventListener: (event: never, cb: () => void) => void;
    removeEventListener: (event: never, cb: () => void) => void;
  };
  carMeshesRef: MutableRefObject<THREE.Mesh[]>;
  cubeCirclesRef: MutableRefObject<THREE.Mesh[][]>;
  carQuaternionsRef: MutableRefObject<Map<string, THREE.Quaternion>>;
}
