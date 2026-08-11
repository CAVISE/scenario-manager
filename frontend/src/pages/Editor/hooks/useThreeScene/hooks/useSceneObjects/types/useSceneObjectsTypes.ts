import * as THREE from 'three';
import type { MutableRefObject } from 'react';
export interface UseSceneObjectsProps {
  updateSceneGraph: () => void;
  buildingModelRef: React.RefObject<THREE.Object3D | null>;
}

export interface UseSceneObjectsResult {
  loadRSU: () => void;
  loadPoints: () => void;
  syncRoadMesh: (roadMesh: THREE.Mesh | null) => void;
  localLineArrRef: MutableRefObject<THREE.Line[][]>;
}
