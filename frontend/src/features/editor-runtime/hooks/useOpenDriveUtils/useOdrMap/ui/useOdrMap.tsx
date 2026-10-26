import * as THREE from 'three';

import { COLORS } from '../constants/useOdrMapConstants';
import type {
  OdrMapMaterials,
  OdrMapMeshes,
  LoadOdrMapParams,
} from '../types/useOdrMapTypes';
import {
  fitViewToBbox,
  filterInvalidPrimitives,
  get_geometry,
  getStdMapEntries,
  getStdVecEntries,
  sanitizePositions,
} from '@editor/scene/utils/sceneHelpers';
import { encodeUInt32 } from '@/shared/lib/editorUtils';
import { useWorkspacePreferences } from '@/store/ui/useWorkspacePreferences';
import { isEditorVisualVisible } from '@editor/lib/visualPreferences';
import { PickingScenes } from '../../useThreeSetup/types/useThreeSetupTypes';
import type {
  PreparedOdrGeometry,
  PreparedOdrMesh,
} from '@editor/types/odrGeometryTypes';

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

export function disposeOdrMaterials(materials: OdrMapMaterials): void {
  Object.values(materials).forEach((material) => material.dispose());
}

function setEncodedIds(
  attribute: THREE.BufferAttribute | THREE.InterleavedBufferAttribute,
  range: readonly [number, number],
  encodedId: Float32Array
): void {
  const start = Math.max(0, Math.min(attribute.count, Math.trunc(range[0])));
  const end = Math.max(start, Math.min(attribute.count, Math.trunc(range[1])));
  if (end === start) return;

  const ids = attribute.array as Float32Array;
  for (let vertex = start; vertex < end; vertex += 1) {
    ids.set(encodedId, vertex * 4);
  }
  attribute.needsUpdate = true;
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
  if (options.preparedGeometry) {
    return buildPreparedOdrScene(options, options.preparedGeometry);
  }
  return buildModuleOdrScene(options);
}

function buildModuleOdrScene(options: LoadOdrMapParams): OdrMapMeshes {
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
  const reflinePositions = sanitizePositions(
    getStdVecEntries(reflineSegments.vertices)
  );
  reflineGeometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(reflinePositions.values, 3)
  );
  reflineGeometry.setIndex(
    filterInvalidPrimitives(
      getStdVecEntries(reflineSegments.indices, true),
      reflinePositions.validVertices,
      2
    )
  );
  reflineGeometry.computeBoundingBox();
  reflineGeometry.computeBoundingSphere();
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
    const encodedLaneId = encodeUInt32(laneStartVertexIndex);
    setEncodedIds(
      roadNetworkGeometry.attributes.id,
      vertexIndexRange,
      encodedLaneId
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
  const roadmarkGeometry = get_geometry(roadmarkMesh, {
    withVertexNormals: false,
  });
  roadmarkGeometry.attributes.color.array.fill(COLORS.roadmark);

  for (const [roadmarkStartVertexIndex] of getStdMapEntries<number, number>(
    roadmarkMesh.roadmark_type_start_indices
  )) {
    const vertexIndexRange = roadmarkMesh.get_idx_interval_roadmark(
      roadmarkStartVertexIndex
    );
    const encodedRoadmarkId = encodeUInt32(roadmarkStartVertexIndex);
    setEncodedIds(
      roadmarkGeometry.attributes.id,
      vertexIndexRange,
      encodedRoadmarkId
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
    filterInvalidPrimitives(
      getStdVecEntries(laneMesh.get_lane_outline_indices(), true),
      roadNetworkGeometry.userData.validVertices as Uint8Array,
      2
    )
  );
  laneOutlineGeometry.computeBoundingBox();
  laneOutlineGeometry.computeBoundingSphere();
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
    filterInvalidPrimitives(
      getStdVecEntries(roadmarkMesh.get_roadmark_outline_indices(), true),
      roadmarkGeometry.userData.validVertices as Uint8Array,
      2
    )
  );
  roadmarkOutlineGeometry.computeBoundingBox();
  roadmarkOutlineGeometry.computeBoundingSphere();
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
  ground_grid.visible = isEditorVisualVisible(
    useWorkspacePreferences.getState(),
    'grid'
  );
  disposableGeometries.push(ground_grid.geometry);
  scene.add(ground_grid);

  light.position.set(bbox.min.x, bbox.min.y, bbox.max.z + diag);
  light.target.position.set(center.x, center.y, center.z);
  light.target.updateMatrixWorld();

  if (!scene.children.includes(transformControls)) scene.add(transformControls);

  return {
    refline_lines,
    road_network_mesh,
    roadmarks_mesh,
    lane_outline_lines,
    roadmark_outline_lines,
    ground_grid,
  };
}

function createPreparedGeometry(
  data: PreparedOdrMesh,
  withVertexNormals = true
): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.BufferAttribute(data.positions, 3)
  );
  geometry.setAttribute('st', new THREE.BufferAttribute(data.stCoordinates, 2));
  geometry.setAttribute('color', new THREE.BufferAttribute(data.colors, 3));
  geometry.setAttribute('id', new THREE.BufferAttribute(data.ids, 4));
  geometry.setIndex(new THREE.BufferAttribute(data.indices, 1));
  if (withVertexNormals) geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

function createIntervalLookup(intervals: Uint32Array) {
  const ranges = new Map<number, readonly [number, number]>();
  for (let offset = 0; offset < intervals.length; offset += 3) {
    ranges.set(intervals[offset], [
      intervals[offset + 1],
      intervals[offset + 2],
    ]);
  }

  return {
    getInterval: (id: number): readonly [number, number] =>
      ranges.get(id) ?? [0, 0],
    delete: () => ranges.clear(),
  };
}

function createPreparedRoadNetwork(geometry: PreparedOdrGeometry) {
  const lanes = createIntervalLookup(geometry.lanes.intervals);
  const roadmarks = createIntervalLookup(geometry.roadmarks.intervals);

  return {
    lanes_mesh: {
      get_idx_interval_lane: lanes.getInterval,
      // The WASM binding returns a short-lived wrapper here. Spotlight code
      // disposes that wrapper after every pick, so the JS replacement must
      // keep the shared interval data alive until the whole map is cleared.
      delete: () => {},
    },
    roadmarks_mesh: {
      get_idx_interval_roadmark: roadmarks.getInterval,
      delete: () => {},
    },
    delete: () => {
      lanes.delete();
      roadmarks.delete();
    },
  };
}

function buildPreparedOdrScene(
  options: LoadOdrMapParams,
  preparedGeometry: PreparedOdrGeometry
): OdrMapMeshes {
  const {
    scene,
    camera,
    controls,
    light,
    transformControls,
    pickingScenes,
    pickingMaterials,
    materials,
    params,
    disposableGeometries,
    fitView,
  } = options;

  const reflineGeometry = new THREE.BufferGeometry();
  reflineGeometry.setAttribute(
    'position',
    new THREE.BufferAttribute(preparedGeometry.reflinePositions, 3)
  );
  reflineGeometry.setIndex(
    new THREE.BufferAttribute(preparedGeometry.reflineIndices, 1)
  );
  reflineGeometry.computeBoundingBox();
  reflineGeometry.computeBoundingSphere();
  const refline_lines = new THREE.LineSegments(
    reflineGeometry,
    materials.refline
  );
  refline_lines.renderOrder = 10;
  refline_lines.visible = params.ref_line;
  refline_lines.matrixAutoUpdate = false;
  disposableGeometries.push(reflineGeometry);
  scene.add(refline_lines);

  const roadNetworkGeometry = createPreparedGeometry(preparedGeometry.lanes);
  disposableGeometries.push(roadNetworkGeometry);
  roadNetworkGeometry.computeBoundsTree();
  const road_network_mesh = new THREE.Mesh(
    roadNetworkGeometry,
    materials.road_network
  );
  road_network_mesh.renderOrder = 0;
  road_network_mesh.userData = {
    odr_road_network_mesh: createPreparedRoadNetwork(preparedGeometry),
  };
  road_network_mesh.matrixAutoUpdate = false;
  road_network_mesh.visible = params.view_mode !== 'Outlines';
  scene.add(road_network_mesh);

  const addPicking = (target: THREE.Scene, material: THREE.ShaderMaterial) =>
    target.add(
      Object.assign(new THREE.Mesh(roadNetworkGeometry, material), {
        matrixAutoUpdate: false,
      })
    );
  addPicking(pickingScenes.lane, pickingMaterials.id);
  addPicking(pickingScenes.xyz, pickingMaterials.xyz);

  const roadmarkGeometry = createPreparedGeometry(
    preparedGeometry.roadmarks,
    false
  );
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
    new THREE.BufferAttribute(preparedGeometry.lanes.outlineIndices, 1)
  );
  laneOutlineGeometry.computeBoundingBox();
  laneOutlineGeometry.computeBoundingSphere();
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
    new THREE.BufferAttribute(preparedGeometry.roadmarks.outlineIndices, 1)
  );
  roadmarkOutlineGeometry.computeBoundingBox();
  roadmarkOutlineGeometry.computeBoundingSphere();
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
  const diagonal = bbox.min.distanceTo(bbox.max);
  camera.far = diagonal * 1.5;
  camera.near = Math.max(0.1, camera.far / 20000);
  camera.updateProjectionMatrix();
  controls.autoRotate = fitView;
  if (fitView) fitViewToBbox(bbox, camera, controls);

  const center = new THREE.Vector3();
  bbox.getCenter(center);
  const ground_grid = new THREE.GridHelper(
    diagonal,
    diagonal / 10,
    0x2f2f2f,
    0x2f2f2f
  );
  ground_grid.geometry.rotateX(Math.PI / 2);
  ground_grid.position.set(center.x, center.y, bbox.min.z - 0.1);
  ground_grid.visible = isEditorVisualVisible(
    useWorkspacePreferences.getState(),
    'grid'
  );
  disposableGeometries.push(ground_grid.geometry);
  scene.add(ground_grid);

  light.position.set(bbox.min.x, bbox.min.y, bbox.max.z + diagonal);
  light.target.position.set(center.x, center.y, center.z);
  light.target.updateMatrixWorld();
  if (!scene.children.includes(transformControls)) scene.add(transformControls);

  return {
    refline_lines,
    road_network_mesh,
    roadmarks_mesh,
    lane_outline_lines,
    roadmark_outline_lines,
    ground_grid,
  };
}
