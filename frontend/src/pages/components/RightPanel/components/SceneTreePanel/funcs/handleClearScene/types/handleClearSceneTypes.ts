import { TransformControls } from 'three-stdlib';
import * as THREE from 'three';
import { ToastApi } from '../../../../../../../../components/AppToast/types/toastTypes';
export interface handleClearSceneProps {
  carMeshesRef: React.RefObject<THREE.Mesh[]>;
  sceneRef: React.RefObject<THREE.Scene | undefined>;
  cubeCirclesRef: React.RefObject<THREE.Mesh[][]>;
  pointsArrRef: React.RefObject<THREE.Mesh[]>;
  pointsObjsRef: React.RefObject<THREE.Object3D[]>;
  rsuMeshesRef: React.RefObject<THREE.Mesh[]>;
  transformControlsRef: React.RefObject<TransformControls | null>;
  detachTransformControls: () => void;
  toast: ToastApi;
}
