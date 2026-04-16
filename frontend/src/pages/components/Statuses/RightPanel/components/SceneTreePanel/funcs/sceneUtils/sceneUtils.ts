import  * as THREE from 'three';
import { findObjectInSceneProps } from './types/sceneUtilsTypes';
export const findObjectInScene = ({itemId, sceneRef}: findObjectInSceneProps): THREE.Object3D | null => {
    let found: THREE.Object3D | null = null;
    sceneRef.current?.traverse((obj: THREE.Object3D) => {
      if (obj.userData.id === itemId) found = obj;
    });
    return found;
};

export const disposeMesh = (mesh: THREE.Object3D) => {
    mesh.traverse(child => {
      const m = child as THREE.Mesh;
      if (m.isMesh) {
        m.geometry?.dispose();
        const materials = Array.isArray(m.material) ? m.material : [m.material];
        materials.forEach(mt => mt?.dispose());
      }
    });
  };