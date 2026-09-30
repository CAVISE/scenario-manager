import { useCallback } from 'react';
import * as THREE from 'three';
import { useEditorStore } from '@/store';
import { useHooks, useEditorRefs } from '@editor/context';
import { groupByCarId, getGroupedByCarId } from '@/shared/utils/groupByCarId';
import type { UseKeyDownHandlerProps } from '../types/IMouseEventsTypes';
import {
  pushSingleDeletionSnapshot,
  watchSnapshotValidity,
} from '@right-panel/components/SceneTreePanel/funcs/deletionSnapshots';
import { useHistoryActions } from '../../createEvents/useHistoryActions';
import { deleteSelectedObjects } from '@right-panel/components/MultiSelectionProperties/model/batchActions';
import { watchHistoryEntryValidity } from '@right-panel/components/SceneTreePanel/funcs/deletionSnapshots/ui/deletionSnapshots';

function disposeObject3D(obj: THREE.Object3D): void {
  obj.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry?.dispose();
      if (Array.isArray(child.material)) {
        child.material.forEach((mt) => mt.dispose());
      } else {
        child.material?.dispose();
      }
    }
  });
}

function removeObjectFromScene(obj: THREE.Object3D, scene: THREE.Scene): void {
  scene.remove(obj);
  disposeObject3D(obj);
}

export function useKeyDownHandler({ toast }: UseKeyDownHandlerProps) {
  const { updateSceneGraph } = useHooks();
  const {
    sceneRef,
    carMeshesRef,
    transformControlsRef,
    rsuRenderMeshesRef,
    rsuMeshesRef,
    rsuObjectMeshesRef,
    routePointMeshesRef,
    modeRef,
  } = useEditorRefs();
  const onSelectObjects = useEditorStore((s) => s.selectObjects);
  const { undo, redo } = useHistoryActions();

  return useCallback(
    (e: KeyboardEvent) => {
      if (useEditorStore.getState().simulationSession.phase === 'running')
        return;
      const handleDeleteWithUndo = (
        id: string | undefined,
        label: string,
        deleteFn: () => void,
        attached: THREE.Object3D
      ) => {
        if (!id) return;

        const pushed = pushSingleDeletionSnapshot({ id, label });

        const scene = sceneRef.current;
        if (scene) {
          removeObjectFromScene(attached, scene);
        }

        deleteFn();

        onSelectObjects([]);
        updateSceneGraph();

        if (pushed) {
          toast.undo(
            `Deleted ${label}`,
            () =>
              useEditorStore.getState().restoreLastDeletion(pushed.snapshotId),
            undefined,
            watchSnapshotValidity(pushed.snapshotId)
          );
        }
      };

      const transformControls = transformControlsRef.current;
      if (!transformControls) return;
      const scene = sceneRef.current;
      if (!scene) return;
      const mode = modeRef.current;
      const carMeshes = carMeshesRef.current;
      const rsuRenderMeshes = rsuRenderMeshesRef.current;
      const rsuObjectMeshes = rsuObjectMeshesRef.current;
      const rsuMeshes = rsuMeshesRef.current;
      const routePointMeshes = routePointMeshesRef.current;

      const isTypingTarget =
        (e.target as HTMLElement)?.tagName === 'INPUT' ||
        (e.target as HTMLElement)?.tagName === 'TEXTAREA' ||
        (e.target as HTMLElement)?.isContentEditable;

      if (
        (e.ctrlKey || e.metaKey) &&
        e.key.toLowerCase() === 'z' &&
        !isTypingTarget
      ) {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
        return;
      }

      if (e.key === 'Escape') {
        onSelectObjects([]);
        transformControlsRef.current?.detach();
        carMeshes.forEach((mesh) => {
          useEditorStore.getState().updateCar(mesh.userData.id, {
            x: mesh.position.x,
            y: mesh.position.y,
            z: mesh.position.z,
            rotation: mesh.rotation.z,
            scale: mesh.scale.x,
          });
        });
        routePointMeshes.forEach((routePointMeshGroup, carIndex) => {
          const carId = carMeshes[carIndex]?.userData.id;
          const pointsByCarId = groupByCarId(useEditorStore.getState().points);
          const pts = carId ? getGroupedByCarId(pointsByCarId, carId) : [];
          routePointMeshGroup.forEach((routePointMesh, pointIndex) => {
            if (pts[pointIndex])
              useEditorStore.getState().updatePoint(pts[pointIndex].id, {
                x: routePointMesh.position.x,
                y: routePointMesh.position.y,
                z: routePointMesh.position.z,
              });
          });
        });
        mode.isAddedPoints = false;
        return;
      }

      if (e.key !== 'Delete' && e.key !== 'Backspace') return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        (e.target as HTMLElement)?.isContentEditable
      )
        return;

      const tc = transformControls as unknown as {
        object: THREE.Object3D | undefined;
      };
      if (useEditorStore.getState().selectedIds.length > 1) {
        e.preventDefault();
        transformControls.detach();
        const result = deleteSelectedObjects();
        if (result) {
          toast.undo(
            `${result.count} objects deleted`,
            () => useEditorStore.getState().undo(),
            undefined,
            watchHistoryEntryValidity(result.entryId)
          );
        }
        return;
      }
      const attached = tc?.object;
      if (!attached) return;

      const type = attached.userData.type;
      const id = attached.userData.id as string | undefined;

      transformControls.detach();

      if (type === 'car') {
        const carIdx = carMeshes.findIndex((m) => m === attached);

        handleDeleteWithUndo(
          id,
          'CAR',
          () => {
            if (id) {
              useEditorStore.getState().removeCar(id);
              const points = useEditorStore
                .getState()
                .points.filter((p) => p.carId === id);
              points.forEach((p) => {
                useEditorStore.getState().removePoint(p.id);
              });
            }
            if (carIdx !== -1) {
              routePointMeshesRef.current[carIdx]?.forEach((routePointMesh) => {
                scene.remove(routePointMesh);
                disposeObject3D(routePointMesh);
              });
              routePointMeshesRef.current.splice(carIdx, 1);
              carMeshesRef.current.splice(carIdx, 1);
            }
          },
          attached
        );
        return;
      }

      if (type === 'building') {
        handleDeleteWithUndo(
          id,
          'BLD',
          () => {
            if (id) {
              useEditorStore.getState().removeBuilding(id);
            }
          },
          attached
        );
        return;
      }

      if (type === 'rsu') {
        let root: THREE.Object3D = attached;
        while (root.parent && root.userData.type !== 'point') {
          root = root.parent;
        }

        const idx = rsuRenderMeshes.findIndex((rsuMesh) => rsuMesh === root);
        if (idx !== -1) {
          const pointId = root.userData.id as string | undefined;

          handleDeleteWithUndo(
            pointId,
            'RSU',
            () => {
              if (pointId) {
                const rsuIdx = rsuMeshes.findIndex((m) => m === root);
                if (rsuIdx !== -1) {
                  rsuMeshesRef.current.splice(rsuIdx, 1);
                }
                rsuRenderMeshesRef.current.splice(idx, 1);

                const objsIdx = rsuObjectMeshes.findIndex((m) => m === root);
                if (objsIdx !== -1) {
                  rsuObjectMeshesRef.current.splice(objsIdx, 1);
                }

                const rsuIndex = useEditorStore
                  .getState()
                  .RSUs.findIndex((rsu) => rsu.id === pointId);
                if (rsuIndex !== -1)
                  useEditorStore.getState().removeRSU(rsuIndex);
              }
            },
            root
          );
        }
        return;
      }

      if (type === 'pedestrian') {
        handleDeleteWithUndo(
          id,
          'HMN',
          () => {
            if (id) {
              useEditorStore.getState().removePedestrian(id);
            }
          },
          attached
        );
        return;
      }

      if (type === 'lidar') {
        handleDeleteWithUndo(
          id,
          'LDR',
          () => {
            if (id) {
              useEditorStore.getState().removeLidar(id);
            }
          },
          attached
        );
        return;
      }

      if (type === 'route-point') {
        for (let i = 0; i < routePointMeshes.length; i++) {
          const idx = routePointMeshes[i].findIndex(
            (routePointMesh) => routePointMesh === attached
          );
          if (idx !== -1) {
            const carId = carMeshes[i]?.userData.id;
            const points = useEditorStore
              .getState()
              .points.filter((p) => p.carId === carId);
            const pointId = points[idx]?.id;

            const routePointMesh = routePointMeshes[i][idx];

            if (pointId) {
              const pushed = pushSingleDeletionSnapshot({
                id: pointId,
                label: 'WPT',
              });

              scene.remove(routePointMesh);
              disposeObject3D(routePointMesh);
              routePointMeshes[i].splice(idx, 1);

              useEditorStore.getState().removePoint(pointId);

              onSelectObjects([]);
              updateSceneGraph();

              if (pushed) {
                toast.undo(
                  'Deleted WPT',
                  () =>
                    useEditorStore
                      .getState()
                      .restoreLastDeletion(pushed.snapshotId),
                  undefined,
                  watchSnapshotValidity(pushed.snapshotId)
                );
              }
            } else {
              scene.remove(routePointMesh);
              disposeObject3D(routePointMesh);
              routePointMeshes[i].splice(idx, 1);
            }

            break;
          }
        }
        return;
      }

      if (id) {
        const pushed = pushSingleDeletionSnapshot({ id, label: 'OBJ' });
        scene.remove(attached);
        disposeObject3D(attached);
        onSelectObjects([]);
        updateSceneGraph();

        if (pushed) {
          toast.undo(
            'Deleted OBJ',
            () =>
              useEditorStore.getState().restoreLastDeletion(pushed.snapshotId),
            undefined,
            watchSnapshotValidity(pushed.snapshotId)
          );
        }
      }
    },
    [
      sceneRef,
      transformControlsRef,
      carMeshesRef,
      rsuRenderMeshesRef,
      rsuObjectMeshesRef,
      rsuMeshesRef,
      routePointMeshesRef,
      modeRef,
      updateSceneGraph,
      undo,
      redo,
      onSelectObjects,
      toast,
    ]
  );
}
