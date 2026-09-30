import { OdrMapMeshes } from '@editor/hooks/useOpenDriveUtils/useOdrMap/types/useOdrMapTypes';
import { ThreeSetup } from '@editor/hooks/useOpenDriveUtils/useThreeSetup/types/useThreeSetupTypes';
import type { MutableRefObject } from 'react';
import * as THREE from 'three';
export interface ClearSceneParams {
  three: ThreeSetup;
  odrMeshes: OdrMapMeshes;
  disposableGeometries: THREE.BufferGeometry[];
  localLineArrRef: MutableRefObject<THREE.Line[][]>;
  carMeshesRef: MutableRefObject<THREE.Mesh[]>;
  rsuObjectMeshesRef: MutableRefObject<THREE.Mesh[]>;
  routePointMeshesRef: MutableRefObject<THREE.Mesh[][]>;
  carQuaternionsRef: MutableRefObject<Map<string, THREE.Quaternion>>;
  currentCarRef: MutableRefObject<string>;
  currentColorRef: MutableRefObject<string>;
  syncRoadMesh: (mesh: THREE.Mesh | null) => void;
}
