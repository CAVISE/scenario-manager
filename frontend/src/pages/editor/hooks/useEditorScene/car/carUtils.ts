import * as THREE from 'three';
export function applyColor(object: THREE.Object3D, color: string) {
  object.traverse((child) => {
    if (!(child as THREE.Mesh).isMesh) return;
    const mesh = child as THREE.Mesh;

    const setColor = (mat: THREE.Material) => {
      if (
        mat instanceof THREE.MeshPhongMaterial ||
        mat instanceof THREE.MeshBasicMaterial ||
        mat instanceof THREE.MeshStandardMaterial
      ) {
        mat.color.set(`#${color}`);
      }
    };

    if (Array.isArray(mesh.material)) {
      mesh.material.forEach(setColor);
    } else {
      setColor(mesh.material);
    }
  });
}

export function cloneMaterials(object: THREE.Object3D) {
  object.traverse((child) => {
    if (!(child as THREE.Mesh).isMesh) return;
    const mesh = child as THREE.Mesh;
    if (Array.isArray(mesh.material)) {
      mesh.material = mesh.material.map((m) => m.clone());
    } else {
      mesh.material = mesh.material.clone();
    }
  });
}
