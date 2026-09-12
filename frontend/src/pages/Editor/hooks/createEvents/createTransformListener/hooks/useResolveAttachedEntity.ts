import { useEditorStore } from '@/store';
import { MutableRefObject } from 'react';
import { MoveKind } from '../types/createTransformListenerTypes';
import * as THREE from 'three';

export function resolveAttachedEntity(
  obj: THREE.Object3D,
  carMeshesRef: MutableRefObject<THREE.Mesh[]>,
  cubeCirclesRef: MutableRefObject<THREE.Mesh[][]>
): { kind: MoveKind; id: string } | null {
  const { type, id } = obj.userData;

  if (type === 'car' && id) return { kind: 'car', id };
  if (type === 'point' && id) return { kind: 'rsu', id };
  if (type === 'lidar' && id) return { kind: 'lidar', id };
  if (type === 'building' && id) return { kind: 'building', id };
  if (type === 'pedestrian' && id) {
    const isRoot = !obj.parent || obj.parent.userData.type !== 'pedestrian';
    return isRoot ? { kind: 'pedestrian', id } : null;
  }
  if (type === 'circle') {
    const circles = cubeCirclesRef.current;
    for (let i = 0; i < circles.length; i++) {
      const ci = circles[i].indexOf(obj as THREE.Mesh);
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
