import type { MutableRefObject } from 'react';

import * as THREE from 'three';
import type { OpenDriveMapInstance } from '@editor/types/editorTypes';
import { LOADING_STEPS } from '@editor/constants/editorConstants';
import {
  OdrMapMeshes,
  OpenDriveModule,
} from '@editor/hooks/useOpenDriveUtils/useOdrMap/types/useOdrMapTypes';
import type { PreparedOdrGeometry } from '@editor/types/odrGeometryTypes';

/** The last parsed large map. Its typed arrays are shared with Three.js. */
export interface PreparedOdrGeometryCache {
  xodr: string;
  resolution: number;
  geometry: PreparedOdrGeometry;
}

export interface UseOdrMapManagerProps {
  setStep: (step: keyof typeof LOADING_STEPS) => void;
  setError: ((err: Error) => void) | undefined;
  syncRoutePointMeshes: () => void;
  syncRoadMesh: (mesh: THREE.Mesh | null) => void;
  updateSceneGraph: () => void;
  buildingMeshesRef: MutableRefObject<THREE.Object3D[]>;
  localLineArrRef: MutableRefObject<THREE.Mesh[][]>;
}

export interface UseOdrMapManagerResult {
  getOdrMeshes: () => OdrMapMeshes;
  loadOdrMap: (
    clearMap?: boolean,
    fitView?: boolean,
    onComplete?: (success: boolean) => void,
    xodrText?: string
  ) => void;
  cancelMapBuild: () => void;
  reloadOdrMap: () => void;
  setModuleRef: MutableRefObject<OpenDriveModule | null>;
  setMapRef: MutableRefObject<OpenDriveMapInstance | null>;
}
