import {
  OdrMapConfig,
  OdrRoadNetworkMesh,
  OpenDriveMapInstance,
} from '@editor/types/editorTypes';
import type {
  PickingScenes,
  PickingMaterials,
} from '../../useThreeSetup/types/useThreeSetupTypes';
import * as THREE from 'three';
import { MapControls, TransformControls } from 'three-stdlib';

export interface NumberVector {
  size(): number;
  get(index: number): number;
  delete(): void;
}

export interface ReflineSegments {
  vertices: NumberVector;
  indices: NumberVector;
}

export interface OpenDriveModule {
  FS_unlink(path: string): void;
  FS_createDataFile(
    parent: string,
    name: string,
    data: string,
    canRead: boolean,
    canWrite: boolean
  ): void;
  get_refline_segments(
    map: OpenDriveMapInstance,
    resolution: number
  ): ReflineSegments;
  get_road_network_mesh(
    map: OpenDriveMapInstance,
    resolution: number
  ): OdrRoadNetworkMesh;
  HEAP8: { length: number };
  OpenDriveMap: new (
    path: string,
    config: OdrMapConfig
  ) => OpenDriveMapInstance;
}
export interface OdrMapMaterials {
  refline: THREE.LineBasicMaterial;
  road_network: THREE.MeshLambertMaterial;
  lane_outlines: THREE.LineBasicMaterial;
  roadmark_outlines: THREE.LineBasicMaterial;
  roadmarks: THREE.MeshBasicMaterial;
}

export interface OdrMapMeshes {
  refline_lines: THREE.LineSegments | null;
  road_network_mesh: THREE.Mesh<
    THREE.BufferGeometry,
    THREE.MeshLambertMaterial
  > | null;
  roadmarks_mesh: THREE.Mesh<
    THREE.BufferGeometry,
    THREE.MeshBasicMaterial
  > | null;
  lane_outline_lines: THREE.LineSegments | null;
  roadmark_outline_lines: THREE.LineSegments | null;
  ground_grid: THREE.GridHelper | null;
}

export interface LoadOdrMapParams {
  Module: OpenDriveModule;
  OpenDriveMap: OpenDriveMapInstance;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  controls: MapControls;
  light: THREE.DirectionalLight;
  transformControls: TransformControls;
  pickingScenes: PickingScenes;
  pickingMaterials: PickingMaterials;
  materials: OdrMapMaterials;
  resolution: number;
  params: { ref_line: boolean; roadmarks: boolean; view_mode: string };
  disposableGeometries: THREE.BufferGeometry[];
  clearMap: boolean;
  fitView: boolean;
  prevMeshes: OdrMapMeshes;
  onDone: (meshes: OdrMapMeshes) => void;
}
