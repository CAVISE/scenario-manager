import { useEditorStore } from '@/store';
import { MutableRefObject } from 'react';
import { MoveKind } from '../types/createTransformListenerTypes';
import * as THREE from 'three';

export function findMeshForEntity(
  kind: MoveKind,
  id: string,
  scene: THREE.Scene,
  carMeshesRef: MutableRefObject<THREE.Mesh[]>,
  cubeCirclesRef: MutableRefObject<THREE.Mesh[][]>
): THREE.Object3D | null {
  if (kind === 'point') {
    const pt = useEditorStore.getState().points.find((p) => p.id === id);
    if (!pt) return null;
    const carIndex = carMeshesRef.current.findIndex(
      (m) => m.userData.id === pt.carId
    );
    if (carIndex === -1) return null;
    const ci = useEditorStore
      .getState()
      .points.filter((p) => p.carId === pt.carId)
      .findIndex((p) => p.id === id);
    if (ci === -1) return null;
    return cubeCirclesRef.current[carIndex]?.[ci] ?? null;
  }

  const userDataType = kind === 'rsu' ? 'point' : kind;
  let found: THREE.Object3D | null = null;
  scene.traverse((obj) => {
    if (found) return;
    if (obj.userData.type === userDataType && obj.userData.id === id) {
      found = obj;
    }
  });
  return found;
}
