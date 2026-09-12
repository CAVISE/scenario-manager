import * as THREE from 'three';

export const disposeMesh = (mesh: THREE.Object3D): void => {
  mesh.traverse((child) => {
    const m = child as THREE.Mesh;
    if (m.isMesh) {
      m.geometry?.dispose();
      const materials = Array.isArray(m.material) ? m.material : [m.material];
      materials.forEach((mt) => mt?.dispose());
    }
  });
};

export const disposeLine = (line: THREE.Line): void => {
  line.parent?.remove(line);
  line.geometry?.dispose();
  (line.material as THREE.Material)?.dispose();
};

export const disposeCircle = (circle: THREE.Mesh): void => {
  circle.parent?.remove(circle);
  circle.geometry?.dispose();
  (circle.material as THREE.Material)?.dispose();
};

export const removeFromArray = <T>(arr: T[], index: number): T | undefined => {
  if (index >= 0 && index < arr.length) {
    return arr.splice(index, 1)[0];
  }
  return undefined;
};
