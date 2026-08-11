import type { MutableRefObject } from 'react';
import { OpenDriveMapInstance } from '../../../../editor.types';
import {
  OdrMapMaterials,
  OdrMapMeshes,
  OpenDriveModule,
} from '../../../useOdrMap.types';
import { ThreeSetup } from '../../../useThreeSetup.types';
import * as THREE from 'three';
export interface BuildMapParams {
  three: ThreeSetup;
  Module: OpenDriveModule;
  OdrMap: OpenDriveMapInstance;
  odrMaterials: OdrMapMaterials;
  disposableObjs: THREE.BufferGeometry[];
  odrMeshesRef: MutableRefObject<OdrMapMeshes>;
  carMeshesRef: MutableRefObject<THREE.Mesh[]>;
  clearMap: boolean;
  fitView: boolean;
  buildingMeshesRef: MutableRefObject<THREE.Object3D[]>;
  resolution: number;
  params: { ref_line: boolean; roadmarks: boolean; view_mode: string };
  loadRSU: () => void;
  loadPoints: () => void;
  syncRoadMesh: (mesh: THREE.Mesh | null) => void;
  updateSceneGraph: () => void;
  buildingModelRef: React.RefObject<THREE.Object3D | null>;
}
