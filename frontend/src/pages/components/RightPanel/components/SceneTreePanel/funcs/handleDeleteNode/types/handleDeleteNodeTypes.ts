import * as THREE from 'three';
import { TransformControls } from 'three-stdlib';

export interface handleDeleteNodeProps {
  id: string;
  e: React.MouseEvent;
  name: string;
  carMeshesRef: React.RefObject<THREE.Mesh[]>;
  cubeCirclesRef: React.RefObject<THREE.Mesh[][]>;
  pointsArrRef: React.RefObject<THREE.Mesh[]>;
  sceneRef: React.RefObject<THREE.Scene | undefined>;
  transformControlsRef: React.RefObject<TransformControls | undefined>;
  detachTransformControls: () => void;
}
