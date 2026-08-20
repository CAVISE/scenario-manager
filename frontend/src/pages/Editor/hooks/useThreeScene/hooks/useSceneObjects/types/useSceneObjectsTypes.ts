import * as THREE from 'three';
import type { MutableRefObject } from 'react';
export interface UseSceneObjectsProps {
  updateSceneGraph: () => void;
}

export interface UseSceneObjectsResult {
  loadPoints: () => void;
  syncRoadMesh: (roadMesh: THREE.Mesh | null) => void;
  localLineArrRef: MutableRefObject<THREE.Line[][]>;
  loadRSU: () => void;
}
