import { useCallback } from 'react';
import * as THREE from 'three';
import { useEditorStore } from '@/store';
import { useHooks, useEditorRefs } from '@editor/context';
import type { UseKeyDownHandlerProps } from '../types/IMouseEventsTypes';
import { useHistoryActions } from '../../createEvents/useHistoryActions';
import { syncTransformsOnEscape } from '../utils/syncTransformsOnEscape';
import {
  deleteSceneObject,
  disposeSceneObject,
} from '../utils/deleteSceneObject';
import { deleteRoutePoint } from '../utils/deleteRoutePoint';
import { isTypingTarget, isUndoShortcut } from '../utils/keyboardTarget';
import { deleteMultipleSelection } from '../utils/deleteMultipleSelection';

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

      if (isUndoShortcut(e) && !isTypingTarget(e.target)) {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
        return;
      }

      if (e.key === 'Escape') {
        syncTransformsOnEscape({
          carMeshes,
          routePointMeshes,
          detach: () => transformControlsRef.current?.detach(),
          clearSelection: () => onSelectObjects([]),
          mode,
        });
        return;
      }

      if (e.key !== 'Delete' && e.key !== 'Backspace') return;
      if (isTypingTarget(e.target)) return;

      const tc = transformControls as unknown as {
        object: THREE.Object3D | undefined;
      };
      if (useEditorStore.getState().selectedIds.length > 1) {
        e.preventDefault();
        deleteMultipleSelection(() => transformControls.detach(), toast);
        return;
      }
      const attached = tc?.object;
      if (!attached) return;

      const type = attached.userData.type;
      const id = attached.userData.id as string | undefined;

      transformControls.detach();

      if (type === 'car') {
        const carIdx = carMeshes.findIndex((m) => m === attached);

        deleteSceneObject({
          id,
          label: 'CAR',
          object: attached,
          scene,
          clearSelection: () => onSelectObjects([]),
          updateSceneGraph,
          toast,
          deleteState: () => {
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
                disposeSceneObject(routePointMesh);
              });
              routePointMeshesRef.current.splice(carIdx, 1);
              carMeshesRef.current.splice(carIdx, 1);
            }
          },
        });
        return;
      }

      if (type === 'building') {
        deleteSceneObject({
          id,
          label: 'BLD',
          object: attached,
          scene,
          clearSelection: () => onSelectObjects([]),
          updateSceneGraph,
          toast,
          deleteState: () => {
            if (id) {
              useEditorStore.getState().removeBuilding(id);
            }
          },
        });
        return;
      }

      if (type === 'rsu') {
        let root: THREE.Object3D = attached;
        while (root.parent && root.userData.type !== 'rsu') {
          root = root.parent;
        }

        const idx = rsuRenderMeshes.findIndex((rsuMesh) => rsuMesh === root);
        if (idx !== -1) {
          const pointId = root.userData.id as string | undefined;

          deleteSceneObject({
            id: pointId,
            label: 'RSU',
            object: root,
            scene,
            clearSelection: () => onSelectObjects([]),
            updateSceneGraph,
            toast,
            deleteState: () => {
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
          });
        }
        return;
      }

      if (type === 'pedestrian') {
        deleteSceneObject({
          id,
          label: 'HMN',
          object: attached,
          scene,
          clearSelection: () => onSelectObjects([]),
          updateSceneGraph,
          toast,
          deleteState: () => {
            if (id) {
              useEditorStore.getState().removePedestrian(id);
            }
          },
        });
        return;
      }

      if (type === 'lidar') {
        deleteSceneObject({
          id,
          label: 'LDR',
          object: attached,
          scene,
          clearSelection: () => onSelectObjects([]),
          updateSceneGraph,
          toast,
          deleteState: () => {
            if (id) {
              useEditorStore.getState().removeLidar(id);
            }
          },
        });
        return;
      }

      if (type === 'route-point') {
        deleteRoutePoint({
          attached,
          scene,
          routePointMeshes,
          carMeshes,
          clearSelection: () => onSelectObjects([]),
          updateSceneGraph,
          toast,
        });
        return;
      }

      deleteSceneObject({
        id,
        label: 'OBJ',
        object: attached,
        scene,
        deleteState: () => undefined,
        clearSelection: () => onSelectObjects([]),
        updateSceneGraph,
        toast,
      });
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
