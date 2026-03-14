import { useEffect } from 'react';
import * as THREE from 'three';

import type { UseCarMeshSyncParams } from './types/useCarMeshSyncTypes';

function applyColor(object: THREE.Object3D, color: string) {
  object.traverse(child => {
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

function cloneMaterials(object: THREE.Object3D) {
  object.traverse(child => {
    if (!(child as THREE.Mesh).isMesh) return;
    const mesh = child as THREE.Mesh;
    if (Array.isArray(mesh.material)) {
      mesh.material = mesh.material.map(m => m.clone());
    } else {
      mesh.material = mesh.material.clone();
    }
  });
}

export function useCarMeshSync({
  cars,
  selectedId,
  sceneRef,
  carModelRef,
  carMeshesRef,
  transformControlsRef,
  updateSceneGraph
}: UseCarMeshSyncParams) {

  function syncMeshes() {
    const scene = sceneRef.current;
    if (!scene || !carModelRef.current) return;

    carMeshesRef.current = carMeshesRef.current.filter(wrapper => {
      const stillExists = cars.find(c => c.id === wrapper.userData.id);
      if (!stillExists) {
        scene.remove(wrapper);
        wrapper.traverse(child => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.geometry.dispose();
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach(m => m.dispose());
            } else {
              mesh.material.dispose();
            }
          }
        });
      }
      
      return !!stillExists;
    });

    cars.forEach(car => {
      const already = carMeshesRef.current.find(m => m.userData.id === car.id);
      if (already) {

        const isAttached =
          (transformControlsRef.current as unknown as { object?: THREE.Object3D })
            ?.object === already;

        if (!isAttached) {
          already.position.set(car.x, car.y, car.z);
          already.scale.set(car.scale, car.scale, car.scale);
          already.rotation.z = car.rotation ?? 0;
        } else {
          const mode = (transformControlsRef.current as unknown as { mode?: string })?.mode;
          if (mode !== 'translate') already.position.set(car.x, car.y, car.z);
          if (mode !== 'rotate')    already.rotation.z = car.rotation ?? 0;
          if (mode !== 'scale')     already.scale.set(car.scale, car.scale, car.scale);
        }

        applyColor(already, car.color);
        return;
      }

      const wrapper = new THREE.Group();
      wrapper.userData = { type: 'car', id: car.id };
      wrapper.position.set(car.x, car.y, car.z);
      wrapper.scale.set(car.scale, car.scale, car.scale);
      wrapper.rotation.z = car.rotation ?? 0;

      const modelInstance = carModelRef.current!.clone(true);
      modelInstance.position.set(0, 0, 0);
      modelInstance.scale.set(1, 1, 1);

      modelInstance.traverse(child => {
        if ((child as THREE.Mesh).isMesh) {
          child.userData = { type: 'car', id: car.id };
        }
      });

      cloneMaterials(modelInstance);
      applyColor(modelInstance, car.color);

      wrapper.add(modelInstance);
      scene.add(wrapper);
      carMeshesRef.current.push(wrapper as unknown as THREE.Mesh);
    });

    if (selectedId) {
      const selectedMesh = carMeshesRef.current.find(m => m.userData.id === selectedId);
      if (selectedMesh) {
        setTimeout(() => {
          transformControlsRef.current?.attach(selectedMesh);
        }, 50);
      }
    }
    updateSceneGraph(); 
  }

  useEffect(() => {
    syncMeshes();
  }, [cars, selectedId]);

  useEffect(() => {
    if (carModelRef.current) {
      syncMeshes();
      return;
    }

    const interval = setInterval(() => {
      if (carModelRef.current) {
        clearInterval(interval);
        syncMeshes();
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);
}