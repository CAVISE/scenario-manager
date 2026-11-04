import * as THREE from 'three';

export const disposeMesh = (mesh: THREE.Object3D): void => {
  mesh.traverse((child) => {
    const renderable = child as THREE.Object3D & {
      isMesh?: boolean;
      isSprite?: boolean;
      geometry?: THREE.BufferGeometry;
      material?: THREE.Material | THREE.Material[];
    };
    if (renderable.isMesh || renderable.isSprite) {
      if ('geometry' in renderable) renderable.geometry?.dispose();
      const materials = Array.isArray(renderable.material)
        ? renderable.material
        : [renderable.material];
      materials.forEach((mt) => mt?.dispose());
    }
  });
};

export const disposeLine = (line: THREE.Mesh): void => {
  line.parent?.remove(line);
  disposeMesh(line);
};

export const disposeRoutePointMesh = (routePointMesh: THREE.Mesh): void => {
  routePointMesh.parent?.remove(routePointMesh);
  disposeMesh(routePointMesh);
};

export const removeFromArray = <T>(
  items: T[],
  index: number
): T | undefined => {
  if (index >= 0 && index < items.length) {
    return items.splice(index, 1)[0];
  }
  return undefined;
};
