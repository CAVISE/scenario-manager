import * as THREE from 'three';
export function applyColor(object: THREE.Object3D, color?: string) {
  const normalizedColor = (color || 'ffffff').replace(/^#/, '');
  object.traverse((child) => {
    if (!(child as THREE.Mesh).isMesh) return;
    const mesh = child as THREE.Mesh;

    const setColor = (mat: THREE.Material) => {
      const colorMaterial = mat as THREE.Material & { color?: THREE.Color };
      if (colorMaterial.color?.isColor) {
        colorMaterial.color.set(`#${normalizedColor}`);
        mat.needsUpdate = true;
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
