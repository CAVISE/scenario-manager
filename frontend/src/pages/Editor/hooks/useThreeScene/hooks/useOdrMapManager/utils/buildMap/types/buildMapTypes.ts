import { OpenDriveMapInstance } from '../../../../../../../types/editorTypes';
import {
  OdrMapMaterials,
  OdrMapMeshes,
  OpenDriveModule,
} from '../../../../../../useOpenDriveUtils/useOdrMap/types/useOdrMapTypes';
import { ThreeSetup } from '../../../../../../useOpenDriveUtils/useThreeSetup/types/useThreeSetupTypes';
import * as THREE from 'three';
export interface BuildMapParams {
  three: ThreeSetup;
  Module: OpenDriveModule;
  OdrMap: OpenDriveMapInstance;
  odrMaterials: OdrMapMaterials;
  disposableObjs: THREE.BufferGeometry[];
  odrMeshesRef: React.MutableRefObject<OdrMapMeshes>;
  carMeshesRef: React.MutableRefObject<THREE.Mesh[]>;
  clearMap: boolean;
  fitView: boolean;
  resolution: number;
  params: { ref_line: boolean; roadmarks: boolean; view_mode: string };
  loadRSU: () => void;
  loadPoints: () => void;
  syncRoadMesh: (mesh: THREE.Mesh | null) => void;
  updateSceneGraph: () => void;
  buildingModelRef: React.MutableRefObject<THREE.Object3D | null>;
}
