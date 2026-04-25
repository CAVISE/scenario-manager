import { useEffect } from 'react';
import * as THREE from 'three';
import { useEditorStore } from '../../../../../../../store';
import { useEditorRefs, useHooks } from '../../../../../context';
import { createLidarMesh, disposeLidarGroup } from '../utils/LidarUtils';

export function useLidarMeshSync() {
  const { carMeshesRef, transformControlsRef } = useEditorRefs();
  const { updateSceneGraph } = useHooks();
  const lidars = useEditorStore((s) => s.lidars);
  const cars = useEditorStore((s) => s.cars);
  useEffect(() => {
    const timer = setTimeout(() => {
      const carMeshes = carMeshesRef.current;

      const existingGroups = new Map<string, THREE.Group>();
      carMeshes.forEach((wrapper) => {
        wrapper.children.forEach((child) => {
          if (child.userData.type === 'lidar') {
            existingGroups.set(child.userData.id, child as THREE.Group);
          }
        });
      });

      const lidarIds = new Set(lidars.map((l) => l.id));

      existingGroups.forEach((group, id) => {
        if (!lidarIds.has(id)) {
          group.parent?.remove(group);
          disposeLidarGroup(group);
        }
      });

      lidars.forEach((lidar) => {
        const wrapper = carMeshes.find((m) => m.userData.id === lidar.carId) as
          | THREE.Group
          | undefined;
        if (!wrapper) return;

        const existing = existingGroups.get(lidar.id);

        if (existing) {
          const isAttached =
            (
              transformControlsRef.current as unknown as {
                object?: THREE.Object3D;
              }
            )?.object === existing;
          if (!isAttached) {
            existing.position.set(lidar.x, lidar.y, lidar.z);
            existing.rotation.z = lidar.rotation;
          }
          const parentScale = wrapper.scale.x || 1;
          existing.scale.setScalar(1 / parentScale);

          const cone = existing.children.find(
            (c) =>
              (c as THREE.Mesh).isMesh &&
              (c as THREE.Mesh).geometry instanceof THREE.ConeGeometry,
          ) as THREE.Mesh | undefined;
          if (cone) {
            cone.geometry.dispose();
            cone.geometry = new THREE.ConeGeometry(
              lidar.range * 0.1,
              lidar.range * 0.3,
              32,
              1,
              true,
            );
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lidars, cars]);
}
