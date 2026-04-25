import type {
  OpenDriveMapInstance,
  OdrMapConfig,
  OdrRoadNetworkMesh,
} from '../../../../types/editorTypes';
import type {
  PickingScenes,
  PickingMaterials,
} from '../../useThreeSetup/types/useThreeSetupTypes';
import * as THREE from 'three';
import { MapControls, TransformControls } from 'three-stdlib';

export interface OpenDriveModule {
  FS_unlink(path: string): void;
  FS_createDataFile(
    parent: string,
    name: string,
    data: string,
    canRead: boolean,
    canWrite: boolean,
  ): void;
  get_refline_segments(
    map: OpenDriveMapInstance,
    resolution: number,
  ): {
    vertices: { size(): number; get(i: number): number; delete(): void };
    indices: { size(): number; get(i: number): number; delete(): void };
  };
  get_road_network_mesh(
    map: OpenDriveMapInstance,
    resolution: number,
  ): OdrRoadNetworkMesh;
  HEAP8: { length: number };
  OpenDriveMap: new (
    path: string,
    config: OdrMapConfig,
  ) => OpenDriveMapInstance;
}
export const COLORS = {
  road: 1.0,
  roadmark: 1.0,
  lane_outline: 0xffffff,
  roadmark_outline: 0xffffff,
  ref_line: 0x69f0ae,
  lane_highlight: 0xffff00,
  roadmark_highlight: 0xffff00,
};
export interface OdrMapMaterials {
  refline: THREE.LineBasicMaterial;
  road_network: THREE.MeshPhongMaterial;
  lane_outlines: THREE.LineBasicMaterial;
  roadmark_outlines: THREE.LineBasicMaterial;
  roadmarks: THREE.MeshBasicMaterial;
}

export interface OdrMapMeshes {
  refline_lines: THREE.LineSegments | null;
  road_network_mesh: THREE.Mesh<
    THREE.BufferGeometry,
    THREE.MeshPhongMaterial
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
  disposable_objs: THREE.BufferGeometry[];
  clear_map: boolean;
  fit_view: boolean;
  prevMeshes: OdrMapMeshes;
  onDone: (meshes: OdrMapMeshes) => void;
}
