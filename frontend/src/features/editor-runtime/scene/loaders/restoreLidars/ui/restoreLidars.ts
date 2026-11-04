import * as THREE from 'three';
import { useEditorStore } from '@/store';
import { RestoreLidarsOptions } from '../types/restoreLidarsTypes';
import { createLidarMesh } from '../utils/lidarVisual';

export function restoreLidars(opts: RestoreLidarsOptions): void {
  const { carMeshesRef, updateSceneGraph } = opts;
  const carMeshes = carMeshesRef.current;
  if (!carMeshes) return;

  useEditorStore.getState().lidars.forEach((lidar) => {
    const wrapper = carMeshes.find((m) => m.userData.id === lidar.carId) as
      THREE.Group | undefined;
    if (!wrapper) return;
    if (wrapper.children.find((c) => c.userData.id === lidar.id)) return;

    const group = createLidarMesh(lidar);
    group.scale.setScalar(1 / (wrapper.scale.x || 1));

    wrapper.add(group);
    updateSceneGraph();
  });
}
