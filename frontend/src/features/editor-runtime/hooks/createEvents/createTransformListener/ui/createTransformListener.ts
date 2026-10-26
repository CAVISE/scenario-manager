import type * as THREE from 'three';
import { useEditorStore } from '@/store';
import {
  type ActiveMove,
  type CreateTransformListenerOptions,
  type DraggingChangedEvent,
} from '../types/createTransformListenerTypes';
import { MOVE_LABEL } from '../constants/createTransformListener.constants';
import { updaterFor } from '../hooks/useUpdaterFor';
import { readSnapshot } from '../hooks/useReadSnapshot';
import { resolveAttachedEntity } from '../hooks/useResolveAttachedEntity';
import { snapshotsDiffer } from '../utils/snapshotsDiffer';
import { createTransformReattacher } from '../utils/createTransformReattacher';
import { createObjectChangeHandler } from '../utils/createObjectChangeHandler';

export function createTransformListener(
  opts: CreateTransformListenerOptions
): () => void {
  const {
    transformControls,
    sceneRef,
    carMeshesRef,
    routePointMeshesRef,
    localLineArrRef,
    roadMeshRef,
    carQuaternionsRef,
  } = opts;
  const reattacher = createTransformReattacher({
    transformControls,
    sceneRef,
    carMeshesRef,
    routePointMeshesRef,
  });
  const handler = createObjectChangeHandler({
    transformControls,
    carMeshesRef,
    routePointMeshesRef,
    localLineArrRef,
    roadMeshRef,
    carQuaternionsRef,
  });

  let activeMove: ActiveMove | null = null;

  const commitActiveMove = () => {
    if (!activeMove) return;
    const { kind, id, before } = activeMove;
    activeMove = null;

    const after = readSnapshot(kind, id);
    if (!after) return;
    if (!snapshotsDiffer(before, after)) return;

    const update = updaterFor(kind, id);
    useEditorStore.getState().pushHistoryEntry({
      label: MOVE_LABEL[kind],
      undo: () => update(before),
      redo: () => update(after),
    });
  };

  let rafId: number | null = null;
  const flush = () => {
    rafId = null;
    handler();
  };
  const scheduleFlush = () => {
    if (rafId === null) rafId = requestAnimationFrame(flush);
  };
  const cancelScheduledFlush = () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  };

  const onDraggingChanged = (e: DraggingChangedEvent) => {
    if (e.value) {
      reattacher.cancel();
      const obj = (
        transformControls as unknown as { object: THREE.Object3D | undefined }
      ).object;
      const entity = obj
        ? resolveAttachedEntity(obj, carMeshesRef, routePointMeshesRef)
        : null;
      activeMove = entity
        ? (() => {
            const before = readSnapshot(entity.kind, entity.id);
            return before ? { kind: entity.kind, id: entity.id, before } : null;
          })()
        : null;
    } else {
      cancelScheduledFlush();

      const obj = (
        transformControls as unknown as { object: THREE.Object3D | undefined }
      ).object;
      const entity = obj
        ? resolveAttachedEntity(obj, carMeshesRef, routePointMeshesRef)
        : null;

      handler(obj);
      commitActiveMove();

      // Keep the current attachment through the state update. Detaching here
      // makes the gizmo disappear between mouse-up and the asynchronous
      // reattach, especially after a rotate operation.
      if (entity) reattacher.schedule(entity);
    }
  };

  transformControls.addEventListener('objectChange' as never, scheduleFlush);
  transformControls.addEventListener(
    'dragging-changed' as never,
    onDraggingChanged as never
  );
  return () => {
    cancelScheduledFlush();
    reattacher.cancel();
    transformControls.removeEventListener(
      'objectChange' as never,
      scheduleFlush
    );
    transformControls.removeEventListener(
      'dragging-changed' as never,
      onDraggingChanged as never
    );
  };
}
