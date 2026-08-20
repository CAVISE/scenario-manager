import { useCallback } from 'react';
import * as THREE from 'three';
import { useEditorStore } from '@/store';
import { useHooks, useEditorRefs } from '@editor/context';
import { ToastApi } from '@components/AppToast/types/toastTypes';
import { pushSingleDeletionSnapshot } from '@right-panel/components/SceneTreePanel/funcs/deletionSnapshots';
import { useHistoryActions } from '../../createEvents/useHistoryActions';

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

interface UseKeyDownHandlerProps {
  toast: ToastApi;
}

export function useKeyDownHandler({ toast }: UseKeyDownHandlerProps) {
  const { updateSceneGraph } = useHooks();
  const {
    sceneRef,
    carMeshesRef,
    transformControlsRef,
    pointsArrRef,
    rsuMeshesRef,
    pointsObjsRef,
    cubeCirclesRef,
    modeRef,
    loadPointsRef,
  } = useEditorRefs();
  const onSelectObject = useEditorStore((s) => s.selectObject);
  const { undo, redo } = useHistoryActions();

  return useCallback(
    (e: KeyboardEvent) => {
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

        onSelectObject(null);
        updateSceneGraph();

        if (pushed) {
          toast.undo(`Deleted ${label}`, () =>
            useEditorStore.getState().restoreLastDeletion(pushed.snapshotId)
          );
        }
      };

      const transformControls = transformControlsRef.current;
      if (!transformControls) return;
      const scene = sceneRef.current;
      if (!scene) return;
      const mode = modeRef.current;
      const carMeshes = carMeshesRef.current;
      const pointsArr = pointsArrRef.current;
      const pointsObjs = pointsObjsRef.current;
      const rsuMeshes = rsuMeshesRef.current;
      const cubeCircles = cubeCirclesRef.current;

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
        onSelectObject(null);
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
        cubeCircles.forEach((arr, ai) => {
          const carId = carMeshes[ai]?.userData.id;
          const pts = useEditorStore
            .getState()
            .points.filter((p) => p.carId === carId);
          arr.forEach((c, pi) => {
            if (pts[pi])
              useEditorStore.getState().updatePoint(pts[pi].id, {
                x: c.position.x,
                y: c.position.y,
                z: c.position.z,
              });
          });
        });
        loadPointsRef.current();
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
              cubeCirclesRef.current[carIdx]?.forEach((c) => {
                scene.remove(c);
                disposeObject3D(c);
              });
              cubeCirclesRef.current.splice(carIdx, 1);
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

      if (type === 'point') {
        let root: THREE.Object3D = attached;
        while (root.parent && root.userData.type !== 'point') {
          root = root.parent;
        }

        const idx = pointsArr.findIndex((p) => p === root);
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
                pointsArrRef.current.splice(idx, 1);

                const objsIdx = pointsObjs.findIndex((m) => m === root);
                if (objsIdx !== -1) {
                  pointsObjsRef.current.splice(objsIdx, 1);
                }

                useEditorStore.getState().removePoint(pointId);
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

      if (type === 'circle') {
        for (let i = 0; i < cubeCircles.length; i++) {
          const idx = cubeCircles[i].findIndex((c) => c === attached);
          if (idx !== -1) {
            const carId = carMeshes[i]?.userData.id;
            const points = useEditorStore
              .getState()
              .points.filter((p) => p.carId === carId);
            const pointId = points[idx]?.id;

            const circle = cubeCircles[i][idx];

            if (pointId) {
              const pushed = pushSingleDeletionSnapshot({
                id: pointId,
                label: 'WPT',
              });

              scene.remove(circle);
              disposeObject3D(circle);
              cubeCircles[i].splice(idx, 1);

              useEditorStore.getState().removePoint(pointId);

              onSelectObject(null);
              updateSceneGraph();

              if (pushed) {
                toast.undo('Deleted WPT', () =>
                  useEditorStore
                    .getState()
                    .restoreLastDeletion(pushed.snapshotId)
                );
              }
            } else {
              scene.remove(circle);
              disposeObject3D(circle);
              cubeCircles[i].splice(idx, 1);
            }

            loadPointsRef.current();
            break;
          }
        }
        return;
      }

      if (id) {
        const pushed = pushSingleDeletionSnapshot({ id, label: 'OBJ' });
        scene.remove(attached);
        disposeObject3D(attached);
        onSelectObject(null);
        updateSceneGraph();

        if (pushed) {
          toast.undo('Deleted OBJ', () =>
            useEditorStore.getState().restoreLastDeletion(pushed.snapshotId)
          );
        }
      }
    },
    [
      sceneRef,
      transformControlsRef,
      carMeshesRef,
      pointsArrRef,
      pointsObjsRef,
      rsuMeshesRef,
      cubeCirclesRef,
      modeRef,
      loadPointsRef,
      updateSceneGraph,
      undo,
      redo,
      onSelectObject,
      toast,
    ]
  );
}
