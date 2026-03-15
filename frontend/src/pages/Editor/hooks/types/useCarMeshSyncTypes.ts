import * as THREE from 'three';
import { TransformControls } from 'three-stdlib';
import type { Car } from '../../../../store/useEditorStore';


export interface UseCarMeshSyncParams {
  cars: Car[];
  selectedId: string | null;
  sceneRef: React.MutableRefObject<THREE.Scene | undefined>;
  carModelRef: React.MutableRefObject<THREE.Object3D | undefined>;
  carMeshesRef: React.MutableRefObject<THREE.Mesh[]>;
  carQuaternionsRef: React.MutableRefObject<Map<string, THREE.Quaternion>>;
  transformControlsRef: React.MutableRefObject<TransformControls | null>;
  updateSceneGraph: () => void;
}
