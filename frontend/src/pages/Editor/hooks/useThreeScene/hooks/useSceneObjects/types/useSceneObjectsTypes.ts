import * as THREE from 'three';
export interface UseSceneObjectsProps {
  updateSceneGraph: () => void;
  buildingModelRef: React.RefObject<THREE.Object3D | null>;
}

export interface UseSceneObjectsResult {
  loadRSU: () => void;
  loadPoints: () => void;
  syncRoadMesh: (roadMesh: THREE.Mesh | null) => void;
  localLineArrRef: React.RefObject<THREE.Line[][]>;
}
