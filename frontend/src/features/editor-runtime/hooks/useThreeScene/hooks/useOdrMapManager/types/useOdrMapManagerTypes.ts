import type { MutableRefObject } from 'react';

import * as THREE from 'three';
import type { OpenDriveMapInstance } from '@editor/types/editorTypes';
import { LOADING_STEPS } from '@editor/constants/editorConstants';
import {
  OdrMapMeshes,
  OpenDriveModule,
} from '@editor/hooks/useOpenDriveUtils/useOdrMap/types/useOdrMapTypes';

export interface UseOdrMapManagerProps {
  setStep: (step: keyof typeof LOADING_STEPS) => void;
  setError: ((err: Error) => void) | undefined;
  syncRoutePointMeshes: () => void;
  syncRoadMesh: (mesh: THREE.Mesh | null) => void;
  updateSceneGraph: () => void;
  buildingMeshesRef: MutableRefObject<THREE.Object3D[]>;
  localLineArrRef: MutableRefObject<THREE.Line[][]>;
}

export interface UseOdrMapManagerResult {
  getOdrMeshes: () => OdrMapMeshes;
  loadOdrMap: (clearMap?: boolean, fitView?: boolean) => void;
  reloadOdrMap: () => void;
  setModuleRef: MutableRefObject<OpenDriveModule | null>;
  setMapRef: MutableRefObject<OpenDriveMapInstance | null>;
}
