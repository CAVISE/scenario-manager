import { useEffect } from 'react';
import * as THREE from 'three';
import type { Lidar } from '../../../store/useEditorStore';

import type { UseLidarMeshSyncParams } from './types/UseLidarMeshSyncTypes';

function createLidarMesh(lidar: Lidar): THREE.Group {
  const group = new THREE.Group();
  group.userData = { type: 'lidar', id: lidar.id, carId: lidar.carId };

  const bodyGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.3, 16);
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
  const body    = new THREE.Mesh(bodyGeo, bodyMat);
  body.userData = { type: 'lidar', id: lidar.id, carId: lidar.carId };
  group.add(body);

  const coneGeo = new THREE.ConeGeometry(lidar.range * 0.1, lidar.range * 0.3, 32, 1, true);
  const coneMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, wireframe: true, transparent: true, opacity: 0.15 });
  const cone    = new THREE.Mesh(coneGeo, coneMat);
  cone.rotation.x = Math.PI;
  cone.position.z = lidar.range * 0.15;
  cone.userData   = { type: 'lidar', id: lidar.id, carId: lidar.carId };
  group.add(cone);

  group.position.set(lidar.x, lidar.y, lidar.z);
  group.rotation.z = lidar.rotation;

  return group;
}

function disposeLidarGroup(group: THREE.Group) {
  group.traverse(child => {
    const m = child as THREE.Mesh;
    if (m.isMesh) {
      m.geometry?.dispose();
      (Array.isArray(m.material) ? m.material : [m.material]).forEach(mt => mt?.dispose());
    }
  });
}

export function useLidarMeshSync({
  lidars,
  cars,
  carMeshesRef,
  transformControlsRef,
  updateSceneGraph
}: UseLidarMeshSyncParams) {

  useEffect(() => {
    const timer = setTimeout(() => {
      const carMeshes = carMeshesRef.current;

      const existingGroups = new Map<string, THREE.Group>();
      carMeshes.forEach(wrapper => {
        wrapper.children.forEach(child => {
          if (child.userData.type === 'lidar') {
            existingGroups.set(child.userData.id, child as THREE.Group);
          }
        });
      });

      const lidarIds = new Set(lidars.map(l => l.id));

      existingGroups.forEach((group, id) => {
        if (!lidarIds.has(id)) {
          group.parent?.remove(group);
          disposeLidarGroup(group);
        }
      });

      lidars.forEach(lidar => {
        const wrapper = carMeshes.find(m => m.userData.id === lidar.carId) as THREE.Group | undefined;
        if (!wrapper) return;

        const existing = existingGroups.get(lidar.id);

        if (existing) {
          const isAttached =
            (transformControlsRef.current as unknown as { object?: THREE.Object3D })?.object === existing;
          if (!isAttached) {
            existing.position.set(lidar.x, lidar.y, lidar.z);
            existing.rotation.z = lidar.rotation;
          }
          const parentScale = wrapper.scale.x || 1;
          existing.scale.setScalar(1 / parentScale);

          const cone = existing.children.find(
            c => (c as THREE.Mesh).isMesh && (c as THREE.Mesh).geometry instanceof THREE.ConeGeometry
          ) as THREE.Mesh | undefined;
          if (cone) {
            cone.geometry.dispose();
            cone.geometry = new THREE.ConeGeometry(lidar.range * 0.1, lidar.range * 0.3, 32, 1, true);
          }
        } else {
          const group = createLidarMesh(lidar);
          const parentScale = wrapper.scale.x || 1;
          group.scale.setScalar(1 / parentScale);
          wrapper.add(group);
        }
      });
      updateSceneGraph();
    }, 0);

    return () => clearTimeout(timer);
  }, [lidars, cars]);
}
