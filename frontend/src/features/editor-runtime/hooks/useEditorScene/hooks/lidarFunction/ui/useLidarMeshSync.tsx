import { useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';
import { useEditorStore } from '@/store';
import type { Lidar } from '@/entities/vehicle';
import { useEditorRefs, useHooks } from '@editor/context';
import { createLidarMesh, disposeLidarGroup } from '../utils/LidarUtils';
import { invalidateEditorScene } from '@editor/lib/invalidateEditorScene';

export function useLidarMeshSync() {
  const { carMeshesRef, transformControlsRef } = useEditorRefs();
  const { updateSceneGraph } = useHooks();
  const lidars = useEditorStore((s) => s.lidars);
  const cars = useEditorStore((s) => s.cars);
  const lastSyncedLidarsRef = useRef<
    Map<string, { lidar: Lidar; parentScale: number }>
  >(new Map());
  useLayoutEffect(() => {
    const timer = setTimeout(() => {
      const carMeshes = carMeshesRef.current;

      const existingGroups = new Map<string, THREE.Group>();
      const carMeshesById = new Map<string, THREE.Group>();
      carMeshes.forEach((wrapper) => {
        carMeshesById.set(
          wrapper.userData.id,
          wrapper as unknown as THREE.Group
        );
        wrapper.children.forEach((child) => {
          if (child.userData.type === 'lidar') {
            existingGroups.set(child.userData.id, child as THREE.Group);
          }
        });
      });

      const lidarIds = new Set(lidars.map((l) => l.id));

      let structuralChange = false;

      existingGroups.forEach((group, id) => {
        if (!lidarIds.has(id)) {
          group.parent?.remove(group);
          disposeLidarGroup(group);
          lastSyncedLidarsRef.current.delete(id);
          structuralChange = true;
        }
      });

      lidars.forEach((lidar) => {
        const wrapper = carMeshesById.get(lidar.carId);
        if (!wrapper) return;

        const existing = existingGroups.get(lidar.id);

        if (existing) {
          const parentScale = wrapper.scale.x || 1;
          const lastSynced = lastSyncedLidarsRef.current.get(lidar.id);
          if (
            lastSynced?.lidar === lidar &&
            lastSynced.parentScale === parentScale
          ) {
            return;
          }
          lastSyncedLidarsRef.current.set(lidar.id, { lidar, parentScale });

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
          existing.scale.setScalar(1 / parentScale);

          if (lastSynced?.lidar.range !== lidar.range) {
            const cone = existing.children.find(
              (c) =>
                (c as THREE.Mesh).isMesh &&
                (c as THREE.Mesh).geometry instanceof THREE.ConeGeometry
            ) as THREE.Mesh | undefined;
            if (cone) {
              cone.geometry.dispose();
              cone.geometry = new THREE.ConeGeometry(
                lidar.range * 0.1,
                lidar.range * 0.3,
                32,
                1,
                true
              );
              cone.position.z = lidar.range * 0.15;
            }
          }
        } else {
          const group = createLidarMesh(lidar);
          const parentScale = wrapper.scale.x || 1;
          group.scale.setScalar(1 / parentScale);
          wrapper.add(group);
          lastSyncedLidarsRef.current.set(lidar.id, { lidar, parentScale });
          structuralChange = true;
        }
      });
      if (structuralChange) updateSceneGraph();
      invalidateEditorScene();
    }, 0);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lidars, cars]);
}
