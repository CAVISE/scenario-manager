import { useEditorStore } from '@/store';
import type { MutableRefObject } from 'react';
import * as THREE from 'three';
import { findMeshForEntity } from '../hooks/useFindMeshForEntity';
import type {
  AttachedEntity,
  CreateTransformListenerOptions,
} from '../types/createTransformListenerTypes';

interface CreateTransformReattacherOptions {
  transformControls: CreateTransformListenerOptions['transformControls'];
  sceneRef: MutableRefObject<THREE.Scene | undefined>;
  carMeshesRef: MutableRefObject<THREE.Mesh[]>;
  routePointMeshesRef: MutableRefObject<THREE.Mesh[][]>;
}

export function createTransformReattacher({
  transformControls,
  sceneRef,
  carMeshesRef,
  routePointMeshesRef,
}: CreateTransformReattacherOptions) {
  let timer: ReturnType<typeof setTimeout> | null = null;

  const cancel = () => {
    if (timer === null) return;
    clearTimeout(timer);
    timer = null;
  };

  const schedule = (entity: AttachedEntity) => {
    const scene = sceneRef.current;
    if (!scene) return;
    cancel();
    timer = setTimeout(() => {
      timer = null;
      if (!useEditorStore.getState().selectedIds.includes(entity.id)) return;
      const mesh = findMeshForEntity(
        entity.kind,
        entity.id,
        scene,
        carMeshesRef,
        routePointMeshesRef
      );
      if (mesh) transformControls.attach(mesh);
    }, 0);
  };

  return { cancel, schedule };
}
