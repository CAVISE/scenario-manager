import * as THREE from 'three';
import { MapControls } from 'three-stdlib';
import type { StdMap, StdVec,  OdrMeshUnion} from './types/sceneHelpersTypes';

export function get_geometry(odr_meshunion: OdrMeshUnion): THREE.BufferGeometry {
  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(getStdVecEntries(odr_meshunion.vertices, true).flat(), 3));
  geom.setAttribute('st', new THREE.Float32BufferAttribute(getStdVecEntries(odr_meshunion.st_coordinates, true).flat(), 2));
  geom.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(geom.attributes.position.count * 3), 3));
  geom.setAttribute('id', new THREE.Float32BufferAttribute(new Float32Array(geom.attributes.position.count * 4), 4));
  geom.setIndex(getStdVecEntries(odr_meshunion.indices, true));
  geom.computeVertexNormals();
  return geom;
}

export function fitViewToBbox(
  bbox: THREE.Box3,
  camera: THREE.PerspectiveCamera,
  controls: MapControls,
  restrict_zoom = true
) {
  const center_pt = new THREE.Vector3();
  bbox.getCenter(center_pt);
  const l2xy = 0.5 * Math.sqrt(
    Math.pow(bbox.max.x - bbox.min.x, 2.0) +
    Math.pow(bbox.max.y - bbox.min.y, 2)
  );
  const fov2r = (camera.fov * 0.5) * (Math.PI / 180.0);
  const dz = l2xy / Math.tan(fov2r);
  camera.position.set(bbox.min.x, center_pt.y, bbox.max.z + dz);
  controls.target.set(center_pt.x, center_pt.y, center_pt.z);
  if (restrict_zoom)
    controls.maxDistance = center_pt.distanceTo(bbox.max) * 1.2;
  controls.update();
}

export function fitViewToObj(
  obj: THREE.Object3D,
  camera: THREE.PerspectiveCamera,
  controls: MapControls
) {
  const bbox = new THREE.Box3().setFromObject(obj);
  fitViewToBbox(bbox, camera, controls);
}

export function applyVertexColors(
  buffer_attribute: THREE.BufferAttribute | THREE.InterleavedBufferAttribute,
  color: THREE.Color,
  offset: number,
  count: number
) {
  const colors = new Float32Array(count * buffer_attribute.itemSize);
  for (let i = 0; i < count * buffer_attribute.itemSize; i += buffer_attribute.itemSize) {
    colors[i]     = color.r;
    colors[i + 1] = color.g;
    colors[i + 2] = color.b;
  }
  (buffer_attribute as THREE.BufferAttribute).array.set(colors, offset * buffer_attribute.itemSize);
}

export function getStdMapKeys<K>(std_map: StdMap<K, number>, delete_map = false): K[] {
  const map_keys: K[] = [];
  const map_keys_vec = std_map.keys();
  for (let idx = 0; idx < map_keys_vec.size(); idx++)
    map_keys.push(map_keys_vec.get(idx));
  map_keys_vec.delete();
  if (delete_map)
    std_map.delete();
  return map_keys;
}

export function getStdMapEntries<K, V>(std_map: StdMap<K, V>): [K, V][] {
  const map_entries: [K, V][] = [];
  const keys = getStdMapKeys(std_map as StdMap<K, number>);
  for (const key of keys)
    map_entries.push([key, std_map.get(key)]);
  return map_entries;
}

export function getStdVecEntries(
  std_vec: StdVec<number>,
  delete_vec = false,
): number[] {
  const entries: number[] = new Array(std_vec.size());
  for (let idx = 0; idx < std_vec.size(); idx++)
    entries[idx] = std_vec.get(idx);
  if (delete_vec)
    std_vec.delete();
  return entries;
}