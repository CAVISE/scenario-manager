import { OdrMapMeshes } from '../../../../../../useOpenDriveUtils/useOdrMap/types/useOdrMapTypes';
import { ThreeSetup } from '../../../../../../useOpenDriveUtils/useThreeSetup/types/useThreeSetupTypes';
import * as THREE from 'three';
export interface ClearSceneParams {
  three: ThreeSetup;
  odrMeshes: OdrMapMeshes;
  disposableObjs: THREE.BufferGeometry[];
  localLineArrRef: React.MutableRefObject<THREE.Line[][]>;
  carMeshesRef: React.MutableRefObject<THREE.Mesh[]>;
  pointsObjsRef: React.MutableRefObject<THREE.Mesh[]>;
  cubeCirclesRef: React.MutableRefObject<THREE.Mesh[][]>;
  carQuaternionsRef: React.MutableRefObject<Map<string, THREE.Quaternion>>;
  currentCarRef: React.MutableRefObject<string>;
  currentColorRef: React.MutableRefObject<string>;
  syncRoadMesh: (mesh: THREE.Mesh | null) => void;
}
