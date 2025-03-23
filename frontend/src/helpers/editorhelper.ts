import * as THREE from 'three';


export function encodeUInt32(ui32: number): Float32Array {
  const rgba = new Float32Array(4);
  rgba[0] = (ui32 % 256) / 255;
  rgba[1] = (Math.trunc(ui32 / 256) % 256) / 255;
  rgba[2] = (Math.trunc(ui32 / (256 * 256)) % 256) / 255;
  rgba[3] = (Math.trunc(ui32 / (256 * 256 * 256)) % 256) / 255;
  return rgba;
}

export function decodeUInt32(rgba: Float32Array): number {
  return Math.round(rgba[0] * 255)
       + Math.round(rgba[1] * 255) * 256
       + Math.round(rgba[2] * 255) * 256 * 256
       + Math.round(rgba[3] * 255) * 256 * 256 * 256;
}

export function isValid(rgba: Float32Array): boolean {
  return !(rgba[0] === 1 && rgba[1] === 1 && rgba[2] === 1 && rgba[3] === 1);
}

export function isRoadObject(
  object: THREE.Object3D,
  road_network_mesh: THREE.Mesh
): boolean {
  return object === road_network_mesh || road_network_mesh.children.includes(object);
}
