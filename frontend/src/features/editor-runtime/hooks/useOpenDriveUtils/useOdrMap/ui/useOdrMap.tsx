import * as THREE from 'three';

import { COLORS } from '../constants/useOdrMapConstants';
import type {
  OdrMapMaterials,
  OdrMapMeshes,
  LoadOdrMapParams,
} from '../types/useOdrMapTypes';
import { useEditorStore } from '@/store';
import {
  fitViewToBbox,
  get_geometry,
  getStdMapEntries,
  getStdVecEntries,
} from '@editor/scene/utils/sceneHelpers';
import { encodeUInt32 } from '@/shared/lib/editorUtils';
import { PickingScenes } from '../../useThreeSetup/types/useThreeSetupTypes';

export function createOdrMaterials(): OdrMapMaterials {
  return {
    refline: new THREE.LineBasicMaterial({ color: COLORS.ref_line }),
    road_network: new THREE.MeshLambertMaterial({
      vertexColors: true,
      wireframe: false,
      transparent: true,
      opacity: 0.4,
    }),
    lane_outlines: new THREE.LineBasicMaterial({ color: COLORS.lane_outline }),
    roadmark_outlines: new THREE.LineBasicMaterial({
      color: COLORS.roadmark_outline,
    }),
    roadmarks: new THREE.MeshBasicMaterial({ vertexColors: true }),
  };
}

export function clearOdrScene(
  scene: THREE.Scene,
  meshes: OdrMapMeshes,
  pickingScenes: PickingScenes,
  disposableGeometries: THREE.BufferGeometry[]
) {
  meshes.road_network_mesh?.userData.odr_road_network_mesh?.delete();
  const toRemove = [
    meshes.road_network_mesh,
    meshes.roadmarks_mesh,
    meshes.refline_lines,
    meshes.lane_outline_lines,
    meshes.roadmark_outline_lines,
    meshes.ground_grid,
  ];
  toRemove.forEach((o) => {
    if (o) scene.remove(o);
  });
  Object.values(pickingScenes).forEach((s) => s.remove(...s.children));
  disposableGeometries.forEach((geometry) => {
    geometry.disposeBoundsTree();
    geometry.dispose();
  });
  disposableGeometries.length = 0;
}

export function buildOdrScene(options: LoadOdrMapParams): OdrMapMeshes {
  const {
    Module,
    OpenDriveMap,
    scene,
    camera,
    controls,
    light,
    transformControls,
    pickingScenes,
    pickingMaterials,
    materials,
    resolution,
    params,
    disposableGeometries,
    fitView,
  } = options;

  const reflineGeometry = new THREE.BufferGeometry();
  const reflineSegments = Module.get_refline_segments(OpenDriveMap, resolution);
  reflineGeometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(
      getStdVecEntries(reflineSegments.vertices).flat(),
      3
    )
  );
  reflineGeometry.setIndex(getStdVecEntries(reflineSegments.indices, true));
  const refline_lines = new THREE.LineSegments(
    reflineGeometry,
    materials.refline
  );
  refline_lines.renderOrder = 10;
  refline_lines.visible = params.ref_line;
  refline_lines.matrixAutoUpdate = false;
  disposableGeometries.push(reflineGeometry);
  scene.add(refline_lines);

  const odr_road_network_mesh = Module.get_road_network_mesh(
    OpenDriveMap,
    resolution
  );
  const laneMesh = odr_road_network_mesh.lanes_mesh;
  const roadNetworkGeometry = get_geometry(laneMesh);
  roadNetworkGeometry.attributes.color.array.fill(COLORS.road);

  for (const [laneStartVertexIndex] of getStdMapEntries<number, number>(
    laneMesh.lane_start_indices
  )) {
    const vertexIndexRange =
      laneMesh.get_idx_interval_lane(laneStartVertexIndex);
    const vertexCount = vertexIndexRange[1] - vertexIndexRange[0];
    const encodedLaneId = encodeUInt32(laneStartVertexIndex);
    const encodedIds = new Float32Array(vertexCount * 4);
    for (let vertexIndex = 0; vertexIndex < vertexCount; vertexIndex++) {
      encodedIds.set(encodedLaneId, vertexIndex * 4);
    }
    roadNetworkGeometry.attributes.id.array.set(
      encodedIds,
      vertexIndexRange[0] * 4
    );
  }
  disposableGeometries.push(roadNetworkGeometry);
  roadNetworkGeometry.computeBoundsTree();

  const road_network_mesh = new THREE.Mesh(
    roadNetworkGeometry,
    materials.road_network
  );
  road_network_mesh.renderOrder = 0;
  road_network_mesh.userData = { odr_road_network_mesh };
  road_network_mesh.matrixAutoUpdate = false;
  road_network_mesh.visible = params.view_mode !== 'Outlines';
  scene.add(road_network_mesh);

  const addPicking = (s: THREE.Scene, mat: THREE.ShaderMaterial) =>
    s.add(
      Object.assign(new THREE.Mesh(roadNetworkGeometry, mat), {
        matrixAutoUpdate: false,
      })
    );
  addPicking(pickingScenes.lane, pickingMaterials.id);
  addPicking(pickingScenes.xyz, pickingMaterials.xyz);

  const roadmarkMesh = odr_road_network_mesh.roadmarks_mesh;
  const roadmarkGeometry = get_geometry(roadmarkMesh);
  roadmarkGeometry.attributes.color.array.fill(COLORS.roadmark);

  for (const [roadmarkStartVertexIndex] of getStdMapEntries<number, number>(
    roadmarkMesh.roadmark_type_start_indices
  )) {
    const vertexIndexRange = roadmarkMesh.get_idx_interval_roadmark(
      roadmarkStartVertexIndex
    );
    const vertexCount = vertexIndexRange[1] - vertexIndexRange[0];
    const encodedRoadmarkId = encodeUInt32(roadmarkStartVertexIndex);
    const encodedIds = new Float32Array(vertexCount * 4);
    for (let vertexIndex = 0; vertexIndex < vertexCount; vertexIndex++) {
      encodedIds.set(encodedRoadmarkId, vertexIndex * 4);
    }
    roadmarkGeometry.attributes.id.array.set(
      encodedIds,
      vertexIndexRange[0] * 4
    );
  }
  disposableGeometries.push(roadmarkGeometry);

  const roadmarks_mesh = new THREE.Mesh(roadmarkGeometry, materials.roadmarks);
  roadmarks_mesh.matrixAutoUpdate = false;
  roadmarks_mesh.visible = params.view_mode !== 'Outlines' && params.roadmarks;
  scene.add(roadmarks_mesh);
  pickingScenes.roadmark.add(
    Object.assign(new THREE.Mesh(roadmarkGeometry, pickingMaterials.id), {
      matrixAutoUpdate: false,
    })
  );

  const laneOutlineGeometry = new THREE.BufferGeometry();
  laneOutlineGeometry.setAttribute(
    'position',
    roadNetworkGeometry.attributes.position
  );
  laneOutlineGeometry.setIndex(
    getStdVecEntries(laneMesh.get_lane_outline_indices(), true)
  );
  const lane_outline_lines = new THREE.LineSegments(
    laneOutlineGeometry,
    materials.lane_outlines
  );
  lane_outline_lines.renderOrder = 9;
  disposableGeometries.push(laneOutlineGeometry);
  scene.add(lane_outline_lines);

  const roadmarkOutlineGeometry = new THREE.BufferGeometry();
  roadmarkOutlineGeometry.setAttribute(
    'position',
    roadmarkGeometry.attributes.position
  );
  roadmarkOutlineGeometry.setIndex(
    getStdVecEntries(roadmarkMesh.get_roadmark_outline_indices(), true)
  );
  const roadmark_outline_lines = new THREE.LineSegments(
    roadmarkOutlineGeometry,
    materials.roadmark_outlines
  );
  roadmark_outline_lines.renderOrder = 8;
  roadmark_outline_lines.matrixAutoUpdate = false;
  roadmark_outline_lines.visible = params.roadmarks;
  disposableGeometries.push(roadmarkOutlineGeometry);
  scene.add(roadmark_outline_lines);

  const bbox = new THREE.Box3().setFromObject(refline_lines);
  const diag = bbox.min.distanceTo(bbox.max);
  camera.far = diag * 1.5;

  camera.near = Math.max(0.1, camera.far / 20000);
  camera.updateProjectionMatrix();
  controls.autoRotate = fitView;
  if (fitView) fitViewToBbox(bbox, camera, controls);

  const center = new THREE.Vector3();
  bbox.getCenter(center);

  const ground_grid = new THREE.GridHelper(diag, diag / 10, 0x2f2f2f, 0x2f2f2f);
  ground_grid.geometry.rotateX(Math.PI / 2);
  ground_grid.position.set(center.x, center.y, bbox.min.z - 0.1);
  disposableGeometries.push(ground_grid.geometry);
  scene.add(ground_grid);

  light.position.set(bbox.min.x, bbox.min.y, bbox.max.z + diag);
  light.target.position.set(center.x, center.y, center.z);
  light.target.updateMatrixWorld();

  if (!scene.children.includes(transformControls)) scene.add(transformControls);

  console.log(
    '[buildOdrScene] geometry added to scene at',
    performance.now().toFixed(0),
    'ms, scene.children.length =',
    scene.children.length
  );

  if (import.meta.env.DEV) {
    console.log(`Heap: ${(Module.HEAP8.length / 1024 / 1024) | 0} MB`);
    console.log(JSON.stringify(useEditorStore.getState()));
  }

  return {
    refline_lines,
    road_network_mesh,
    roadmarks_mesh,
    lane_outline_lines,
    roadmark_outline_lines,
    ground_grid,
  };
}
