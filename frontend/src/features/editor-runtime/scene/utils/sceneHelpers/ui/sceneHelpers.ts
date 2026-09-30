import * as THREE from 'three';
import { MapControls } from 'three-stdlib';
import type { StdMap, StdVec } from '../types/sceneHelpersTypes';
import {
  RADIANS_CONVERSION,
  ZOOM_MULTIPLIER,
} from '../utils/sceneHelpers.utils';

export function fitViewToBbox(
  bbox: THREE.Box3,
  camera: THREE.PerspectiveCamera,
  controls: MapControls,
  restrictZoom = true
): void {
  const center = new THREE.Vector3();
  bbox.getCenter(center);

  const dx = bbox.max.x - bbox.min.x;
  const dy = bbox.max.y - bbox.min.y;
  const halfDiagonalXY = 0.5 * Math.sqrt(dx * dx + dy * dy);
  const halfFovRadians = camera.fov * 0.5 * RADIANS_CONVERSION;

  const distanceZ = halfDiagonalXY / Math.tan(halfFovRadians);
  camera.position.set(center.x, center.y, bbox.max.z + distanceZ);
  controls.target.copy(center);
  if (restrictZoom) {
    controls.maxDistance = center.distanceTo(bbox.max) * ZOOM_MULTIPLIER;
  }

  controls.update();
}

export function fitViewToObj(
  obj: THREE.Object3D,
  camera: THREE.PerspectiveCamera,
  controls: MapControls
): void {
  const bbox = new THREE.Box3().setFromObject(obj);
  fitViewToBbox(bbox, camera, controls);
}

export function applyVertexColors(
  bufferAttribute: THREE.BufferAttribute | THREE.InterleavedBufferAttribute,
  color: THREE.Color,
  offset: number,
  count: number
): void {
  const attribute = bufferAttribute as THREE.BufferAttribute;
  const array = attribute.array;
  const itemSize = attribute.itemSize;
  const startIndex = offset * itemSize;
  const endIndex = startIndex + count * itemSize;

  for (let i = startIndex; i < endIndex; i += itemSize) {
    array[i] = color.r;
    array[i + 1] = color.g;
    array[i + 2] = color.b;
  }

  attribute.needsUpdate = true;
}

export function getStdMapKeys<K>(
  stdMap: StdMap<K, number>,
  deleteMap = false
): K[] {
  const keys: K[] = [];
  const keysVec = stdMap.keys();

  for (let i = 0; i < keysVec.size(); i++) {
    keys.push(keysVec.get(i));
  }

  keysVec.delete();
  if (deleteMap) {
    stdMap.delete();
  }

  return keys;
}

export function getStdMapEntries<K, V>(stdMap: StdMap<K, V>): [K, V][] {
  const entries: [K, V][] = [];
  const keys = getStdMapKeys(stdMap as StdMap<K, number>);

  for (const key of keys) {
    entries.push([key, stdMap.get(key)]);
  }

  return entries;
}

export function getStdVecEntries(
  stdVec: StdVec<number>,
  deleteVec = false
): number[] {
  const size = stdVec.size();
  const entries = new Array<number>(size);

  for (let i = 0; i < size; i++) {
    entries[i] = stdVec.get(i);
  }

  if (deleteVec) {
    stdVec.delete();
  }

  return entries;
}
