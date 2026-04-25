import * as THREE from 'three';

export function disposeMesh(obj: THREE.Mesh) {
  obj.geometry?.dispose();
  const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
  mats.forEach((m) => m?.dispose());
  obj.parent?.remove(obj);
}

export function disposeLine(l: THREE.Line) {
  l.parent?.remove(l);
  l.geometry?.dispose();
  (l.material as THREE.Material)?.dispose();
}
