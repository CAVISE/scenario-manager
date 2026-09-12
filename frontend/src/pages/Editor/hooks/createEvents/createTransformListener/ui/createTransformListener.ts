import * as THREE from 'three';
import { useEditorStore } from '@/store';
import {
  ActiveMove,
  CreateTransformListenerOptions,
} from '../types/createTransformListenerTypes';
import { MOVE_LABEL } from '../constants/createTransformListener.constants';
import { updaterFor } from '../hooks/useUpdaterFor';
import { readSnapshot } from '../hooks/useReadSnapshot';
import { resolveAttachedEntity } from '../hooks/useResolveAttachedEntity';
import { findMeshForEntity } from '../hooks/useFindMeshForEntity';
import { snapshotsDiffer } from '../utils/snapshotsDiffer';

export function createTransformListener(
  opts: CreateTransformListenerOptions
): () => void {
  const {
    transformControls,
    sceneRef,
    carMeshesRef,
    cubeCirclesRef,
    carQuaternionsRef,
  } = opts;

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

  const handler = (obj?: THREE.Object3D) => {
    try {
      const target =
        obj ??
        (
          transformControls as unknown as {
            object: THREE.Object3D | undefined;
          }
        ).object;
      if (!target?.userData) return;
      const { type, id } = target.userData;

      if (type === 'car' && id) {
        carQuaternionsRef.current.set(id, target.quaternion.clone());
        useEditorStore.getState().updateCar(id, {
          x: target.position.x,
          y: target.position.y,
          z: target.position.z,
          rotation: target.rotation.z,
          scale: target.scale.x,
        });
      }

      if (type === 'point' && id) {
        useEditorStore.getState().updateRSU(id, {
          x: target.position.x,
          y: target.position.y,
          z: target.position.z,
        });
      }

      if (type === 'lidar' && id) {
        useEditorStore.getState().updateLidar(id, {
          x: target.position.x,
          y: target.position.y,
          z: target.position.z,
          rotation: target.rotation.z,
        });
      }

      if (type === 'building' && id) {
        useEditorStore.getState().updateBuilding(id, {
          x: target.position.x,
          y: target.position.y,
          z: target.position.z,
          rotation: target.rotation.y,
          scale: target.scale.x,
          material: target.userData.material,
          height: target.userData.height,
        });
      }

      if (type === 'pedestrian' && id) {
        const isRoot =
          !target.parent || target.parent.userData.type !== 'pedestrian';
        if (isRoot) {
          const worldPos = new THREE.Vector3();
          target.getWorldPosition(worldPos);
          useEditorStore.getState().updatePedestrian(id, {
            x: worldPos.x,
            y: worldPos.y,
            z: worldPos.z,
          });
        }
      }

      if (type === 'circle') {
        const circles = cubeCirclesRef.current;
        for (let i = 0; i < circles.length; i++) {
          const ci = circles[i].indexOf(target as THREE.Mesh);
          if (ci !== -1) {
            const carId = carMeshesRef.current[i]?.userData.id;
            const pt = useEditorStore
              .getState()
              .points.filter((p) => p.carId === carId)[ci];
            if (pt)
              useEditorStore.getState().updatePoint(pt.id, {
                x: target.position.x,
                y: target.position.y,
                z: target.position.z,
              });
            useEditorStore
              .getState()
              .selectObjects([{ type: 'point', id: pt?.id || '' }]);
            break;
          }
        }
      }
    } catch (err) {
      console.error('objectChange error:', err);
    }
  };

  const onDraggingChanged = (e: { value: boolean }) => {
    if (e.value) {
      const obj = (
        transformControls as unknown as { object: THREE.Object3D | undefined }
      ).object;
      const entity = obj
        ? resolveAttachedEntity(obj, carMeshesRef, cubeCirclesRef)
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
        ? resolveAttachedEntity(obj, carMeshesRef, cubeCirclesRef)
        : null;
      transformControls.detach();

      handler(obj);
      commitActiveMove();

      if (entity && sceneRef.current) {
        const scene = sceneRef.current;
        setTimeout(() => {
          const mesh = findMeshForEntity(
            entity.kind,
            entity.id,
            scene,
            carMeshesRef,
            cubeCirclesRef
          );
          if (mesh) transformControls.attach(mesh);
        }, 0);
      }
    }
  };

  transformControls.addEventListener('objectChange' as never, scheduleFlush);
  transformControls.addEventListener(
    'dragging-changed' as never,
    onDraggingChanged as never
  );
  return () => {
    cancelScheduledFlush();
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
