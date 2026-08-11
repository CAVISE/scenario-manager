import type { MutableRefObject } from 'react';
import { TransformControls } from 'three-stdlib';
import * as THREE from 'three';
import { ToastApi } from '../../../../../shared/ui/AppToast/toast.types';
export interface handleClearSceneProps {
  carMeshesRef: MutableRefObject<THREE.Mesh[]>;
  sceneRef: MutableRefObject<THREE.Scene | undefined>;
  cubeCirclesRef: MutableRefObject<THREE.Mesh[][]>;
  pointsArrRef: MutableRefObject<THREE.Mesh[]>;
  pointsObjsRef: MutableRefObject<THREE.Object3D[]>;
  rsuMeshesRef: MutableRefObject<THREE.Mesh[]>;
  transformControlsRef: MutableRefObject<TransformControls | null>;
  detachTransformControls: () => void;
  toast: ToastApi;
}
