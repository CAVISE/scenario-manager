import type { MutableRefObject } from 'react';
import { OdrMapMeshes } from '../../../useOdrMap.types';
import { ThreeSetup } from '../../../useThreeSetup.types';
import * as THREE from 'three';
export interface ClearSceneParams {
  three: ThreeSetup;
  odrMeshes: OdrMapMeshes;
  disposableObjs: THREE.BufferGeometry[];
  localLineArrRef: MutableRefObject<THREE.Line[][]>;
  carMeshesRef: MutableRefObject<THREE.Mesh[]>;
  pointsObjsRef: MutableRefObject<THREE.Mesh[]>;
  cubeCirclesRef: MutableRefObject<THREE.Mesh[][]>;
  carQuaternionsRef: MutableRefObject<Map<string, THREE.Quaternion>>;
  currentCarRef: MutableRefObject<string>;
  currentColorRef: MutableRefObject<string>;
  syncRoadMesh: (mesh: THREE.Mesh | null) => void;
}
export const DEFAULT_COLOR = '00ff00';
