import { useEditorStore } from '@/store';
import type { MutableRefObject } from 'react';
import type { AttachedEntity } from '../types/createTransformListenerTypes';
import * as THREE from 'three';

export function resolveAttachedEntity(
  obj: THREE.Object3D,
  carMeshesRef: MutableRefObject<THREE.Mesh[]>,
  routePointMeshesRef: MutableRefObject<THREE.Mesh[][]>
): AttachedEntity | null {
  const { type, id } = obj.userData;

  if (type === 'car' && id) return { kind: 'car', id };
  if (type === 'rsu' && id) return { kind: 'rsu', id };
  if (type === 'lidar' && id) return { kind: 'lidar', id };
  if (type === 'building' && id) return { kind: 'building', id };
  if (type === 'pedestrian' && id) {
    const isRoot = !obj.parent || obj.parent.userData.type !== 'pedestrian';
    return isRoot ? { kind: 'pedestrian', id } : null;
  }
  if (type === 'route-point') {
    const routePointMeshes = routePointMeshesRef.current;
    for (let i = 0; i < routePointMeshes.length; i++) {
      const ci = routePointMeshes[i].indexOf(obj as THREE.Mesh);
      if (ci === -1) continue;
      const carId = carMeshesRef.current[i]?.userData.id;
      const pt = useEditorStore
        .getState()
        .points.filter((p) => p.carId === carId)[ci];
      return pt ? { kind: 'point', id: pt.id } : null;
    }
  }
  return null;
}
