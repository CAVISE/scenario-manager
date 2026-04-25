import { OdrMapMeshes } from '../../../../../../useOpenDriveUtils/useOdrMap/types/useOdrMapTypes';
import { ThreeSetup } from '../../../../../../useOpenDriveUtils/useThreeSetup/types/useThreeSetupTypes';
import * as THREE from 'three';
export interface ClearSceneParams {
  three: ThreeSetup;
  odrMeshes: OdrMapMeshes;
  disposableObjs: THREE.BufferGeometry[];
  localLineArrRef: React.RefObject<THREE.Line[][]>;
  carMeshesRef: React.RefObject<THREE.Mesh[]>;
  pointsObjsRef: React.RefObject<THREE.Mesh[]>;
  cubeCirclesRef: React.RefObject<THREE.Mesh[][]>;
  carQuaternionsRef: React.RefObject<Map<string, THREE.Quaternion>>;
  currentCarRef: React.RefObject<string>;
  currentColorRef: React.RefObject<string>;
  syncRoadMesh: (mesh: THREE.Mesh | null) => void;
}
