import * as THREE from 'three';
import { TransformControls } from 'three-stdlib';
import { ToastApi } from '../../../../../../../../components/AppToast/types/toastTypes';

import type { MutableRefObject } from 'react';

export interface handleDeleteNodeProps {
  id: string;
  e: React.MouseEvent;
  name: string;
  carMeshesRef: MutableRefObject<THREE.Mesh[]>;
  cubeCirclesRef: MutableRefObject<THREE.Mesh[][]>;
  pointsArrRef: MutableRefObject<THREE.Mesh[]>;
  sceneRef: MutableRefObject<THREE.Scene | undefined>;
  transformControlsRef: MutableRefObject<TransformControls | null>;
  detachTransformControls: () => void;
  pointsObjsRef: MutableRefObject<THREE.Object3D[]>;
  rsuMeshesRef: MutableRefObject<THREE.Mesh[]>;
  toast: ToastApi;
}
