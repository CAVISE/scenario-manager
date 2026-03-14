import * as THREE from 'three';
import {
  get_geometry,
  fitViewToBbox,
  getStdMapEntries,
  getStdVecEntries,
} from '../scene/sceneHelpers';
import { encodeUInt32 } from '../../../helpers/editorhelper';
import {COLORS} from './types/useOdrMapTypes';
import type { PickingScenes } from './types/useThreeSetupTypes';
import type { OdrMapMaterials, OdrMapMeshes, LoadOdrMapParams } from './types/useOdrMapTypes';

export function createOdrMaterials(): OdrMapMaterials {
  return {
    refline:           new THREE.LineBasicMaterial({ color: COLORS.ref_line }),
    road_network:      new THREE.MeshPhongMaterial({ vertexColors: true, wireframe: false, shininess: 20.0, transparent: true, opacity: 0.4 }),
    lane_outlines:     new THREE.LineBasicMaterial({ color: COLORS.lane_outline }),
    roadmark_outlines: new THREE.LineBasicMaterial({ color: COLORS.roadmark_outline }),
    roadmarks:         new THREE.MeshBasicMaterial({ vertexColors: true }),
  };
}

export function clearOdrScene(
  scene: THREE.Scene,
  meshes: OdrMapMeshes,
  pickingScenes: PickingScenes,
  disposable_objs: THREE.BufferGeometry[],
) {
  meshes.road_network_mesh?.userData.odr_road_network_mesh?.delete();
  const toRemove = [
    meshes.road_network_mesh, meshes.roadmarks_mesh, meshes.refline_lines,
    meshes.lane_outline_lines, meshes.roadmark_outline_lines, meshes.ground_grid,
  ];
  toRemove.forEach(o => { if (o) scene.remove(o); });
  Object.values(pickingScenes).forEach(s => s.remove(...s.children));
  disposable_objs.forEach(g => g.dispose());
  disposable_objs.length = 0;
}

export function buildOdrScene(p: LoadOdrMapParams): OdrMapMeshes {
  const { Module, OpenDriveMap, scene, camera, controls, light, transformControls,
    pickingScenes, pickingMaterials, materials, resolution, params, disposable_objs, fit_view } = p;


  const reflines_geom = new THREE.BufferGeometry();
  const odr_segs = Module.get_refline_segments(OpenDriveMap, resolution);
  reflines_geom.setAttribute('position', new THREE.Float32BufferAttribute(getStdVecEntries(odr_segs.vertices).flat(), 3));
  reflines_geom.setIndex(getStdVecEntries(odr_segs.indices, true));
  const refline_lines = new THREE.LineSegments(reflines_geom, materials.refline);
  refline_lines.renderOrder = 10;
  refline_lines.visible = params.ref_line;
  refline_lines.matrixAutoUpdate = false;
  disposable_objs.push(reflines_geom);
  scene.add(refline_lines);

  const odr_road_network_mesh = Module.get_road_network_mesh(OpenDriveMap, resolution);
  const odr_lanes_mesh        = odr_road_network_mesh.lanes_mesh;
  const road_network_geom     = get_geometry(odr_lanes_mesh);
  road_network_geom.attributes.color.array.fill(COLORS.road);

  for (const [vsi] of getStdMapEntries<number, number>(odr_lanes_mesh.lane_start_indices)) {
    const vi = odr_lanes_mesh.get_idx_interval_lane(vsi);
    const vc = vi[1] - vi[0];
    const enc = encodeUInt32(vsi);
    const arr = new Float32Array(vc * 4);
    for (let i = 0; i < vc; i++) arr.set(enc, i * 4);
    road_network_geom.attributes.id.array.set(arr, vi[0] * 4);
  }
  disposable_objs.push(road_network_geom);

  const road_network_mesh = new THREE.Mesh(road_network_geom, materials.road_network);
  road_network_mesh.renderOrder = 0;
  road_network_mesh.userData    = { odr_road_network_mesh };
  road_network_mesh.matrixAutoUpdate = false;
  road_network_mesh.visible     = params.view_mode !== 'Outlines';
  scene.add(road_network_mesh);

  const addPicking = (s: THREE.Scene, mat: THREE.ShaderMaterial) =>
    s.add(Object.assign(new THREE.Mesh(road_network_geom, mat), { matrixAutoUpdate: false }));
  addPicking(pickingScenes.lane, pickingMaterials.id);
  addPicking(pickingScenes.xyz,  pickingMaterials.xyz);
  addPicking(pickingScenes.st,   pickingMaterials.st);

  const odr_roadmarks_mesh = odr_road_network_mesh.roadmarks_mesh;
  const roadmarks_geom     = get_geometry(odr_roadmarks_mesh);
  roadmarks_geom.attributes.color.array.fill(COLORS.roadmark);

  for (const [vsi] of getStdMapEntries<number, number>(odr_roadmarks_mesh.roadmark_type_start_indices)) {
    const vi = odr_roadmarks_mesh.get_idx_interval_roadmark(vsi);
    const vc = vi[1] - vi[0];
    const enc = encodeUInt32(vsi);
    const arr = new Float32Array(vc * 4);
    for (let i = 0; i < vc; i++) arr.set(enc, i * 4);
    roadmarks_geom.attributes.id.array.set(arr, vi[0] * 4);
  }
  disposable_objs.push(roadmarks_geom);

  const roadmarks_mesh = new THREE.Mesh(roadmarks_geom, materials.roadmarks);
  roadmarks_mesh.matrixAutoUpdate = false;
  roadmarks_mesh.visible = params.view_mode !== 'Outlines' && params.roadmarks;
  scene.add(roadmarks_mesh);
  pickingScenes.roadmark.add(Object.assign(new THREE.Mesh(roadmarks_geom, pickingMaterials.id), { matrixAutoUpdate: false }));

  const lo_geom = new THREE.BufferGeometry();
  lo_geom.setAttribute('position', road_network_geom.attributes.position);
  lo_geom.setIndex(getStdVecEntries(odr_lanes_mesh.get_lane_outline_indices(), true));
  const lane_outline_lines = new THREE.LineSegments(lo_geom, materials.lane_outlines);
  lane_outline_lines.renderOrder = 9;
  disposable_objs.push(lo_geom);
  scene.add(lane_outline_lines);

  const ro_geom = new THREE.BufferGeometry();
  ro_geom.setAttribute('position', roadmarks_geom.attributes.position);
  ro_geom.setIndex(getStdVecEntries(odr_roadmarks_mesh.get_roadmark_outline_indices(), true));
  const roadmark_outline_lines = new THREE.LineSegments(ro_geom, materials.roadmark_outlines);
  roadmark_outline_lines.renderOrder = 8;
  roadmark_outline_lines.matrixAutoUpdate = false;
  roadmark_outline_lines.visible = params.roadmarks;
  disposable_objs.push(ro_geom);
  scene.add(roadmark_outline_lines);

  const bbox   = new THREE.Box3().setFromObject(refline_lines);
  const diag   = bbox.min.distanceTo(bbox.max);
  camera.far   = diag * 1.5;
  controls.autoRotate = fit_view;
  if (fit_view) fitViewToBbox(bbox, camera, controls);

  const center = new THREE.Vector3();
  bbox.getCenter(center);

  const ground_grid = new THREE.GridHelper(diag, diag / 10, 0x2f2f2f, 0x2f2f2f);
  ground_grid.geometry.rotateX(Math.PI / 2);
  ground_grid.position.set(center.x, center.y, bbox.min.z - 0.1);
  disposable_objs.push(ground_grid.geometry);
  scene.add(ground_grid);

  light.position.set(bbox.min.x, bbox.min.y, bbox.max.z + diag);
  light.target.position.set(center.x, center.y, center.z);
  light.target.updateMatrixWorld();

  if (!scene.children.includes(transformControls)) scene.add(transformControls);

  console.log(`Heap: ${Module.HEAP8.length / 1024 / 1024 | 0} MB`);

  return { refline_lines, road_network_mesh, roadmarks_mesh, lane_outline_lines, roadmark_outline_lines, ground_grid };
}