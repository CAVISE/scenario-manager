import * as THREE from 'three';
import type { MutableRefObject } from 'react';

export interface CreateTransformListenerOptions {
  transformControls: {
    addEventListener: (event: never, cb: () => void) => void;
    removeEventListener: (event: never, cb: () => void) => void;
    detach: () => void;
    attach: (obj: THREE.Object3D) => void;
  };
  sceneRef: MutableRefObject<THREE.Scene | undefined>;
  carMeshesRef: MutableRefObject<THREE.Mesh[]>;
  cubeCirclesRef: MutableRefObject<THREE.Mesh[][]>;
  carQuaternionsRef: MutableRefObject<Map<string, THREE.Quaternion>>;
}
export type MoveKind =
  'car' | 'rsu' | 'lidar' | 'building' | 'pedestrian' | 'point';

export type ActiveMove = {
  kind: MoveKind;
  id: string;
  before: Record<string, unknown>;
};
