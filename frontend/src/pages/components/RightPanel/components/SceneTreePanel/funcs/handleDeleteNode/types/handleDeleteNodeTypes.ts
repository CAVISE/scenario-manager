import * as THREE from 'three';
import { TransformControls } from 'three-stdlib';

export interface handleDeleteNodeProps {
  id: string;
  e: React.MouseEvent;
  name: string;
  carMeshesRef: React.MutableRefObject<THREE.Mesh[]>;
  cubeCirclesRef: React.MutableRefObject<THREE.Mesh[][]>;
  pointsArrRef: React.MutableRefObject<THREE.Mesh[]>;
  sceneRef: React.MutableRefObject<THREE.Scene | undefined>;
  transformControlsRef: React.MutableRefObject<TransformControls | undefined>;
  detachTransformControls: () => void;
}
