import {
  OpenDriveModule,
  OdrMapMaterials,
  OdrMapMeshes,
} from '@editor/hooks/useOpenDriveUtils/useOdrMap/types/useOdrMapTypes';
import { ThreeSetup } from '@editor/hooks/useOpenDriveUtils/useThreeSetup/types/useThreeSetupTypes';
import { OpenDriveMapInstance } from '@editor/types/editorTypes';
import type { MutableRefObject } from 'react';

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
  loadPoints: () => void;
  syncRoadMesh: (mesh: THREE.Mesh | null) => void;
  updateSceneGraph: () => void;
}
