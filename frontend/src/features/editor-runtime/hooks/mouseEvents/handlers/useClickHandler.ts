import { useCallback } from 'react';
import * as THREE from 'three';
import { useEditorStore } from '@/store';
import { resolveSelection } from '@/store/utils/sceneEntities';
import type { SharedMouseContext } from '../types/IMouseEventsTypes';
import { useEditorRefs } from '@editor/context';

export function useClickHandler(ctx: SharedMouseContext) {
  const {
    sceneRef,
    transformControlsRef,
    cameraRef,
    roadMeshRef,
    modeRef,
    currentCarRef,
    currentColorRef,
    pickableObjectsRef,
    isDraggingRef,
  } = useEditorRefs();

  return useCallback((event: MouseEvent) => {
    if (!ctx.insideEditorCanvas(event)) return;
    // `click` fires after TransformControls' pointer-up. Keep the selected
    // object intact instead of treating the release over a gizmo as a blank
    // canvas click and clearing the selection.
    if (isDraggingRef.current) return;
    const tc = transformControlsRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    if (!tc || !scene || !camera) return;
    event.preventDefault();
    ctx.setMouse(event);
    ctx.raycaster.setFromCamera(ctx.mouse, camera);
    const state = useEditorStore.getState();
    const readOnly = state.simulationSession.phase === 'running';
    const additive = event.shiftKey || event.ctrlKey || event.metaKey;
    const road = roadMeshRef.current;
    const mode = modeRef.current;

    if (mode.isAddCarModeActive && !readOnly && road) {
      const [roadHit] = ctx.raycaster.intersectObject(road, true);
      if (roadHit) {
        if (!currentCarRef.current)
          currentCarRef.current = 'car_' + Math.floor(Math.random() * 1000);
        const point = roadHit.point;
        state.addCar(
          point.x,
          point.y,
          point.z,
          currentCarRef.current,
          currentColorRef.current,
          60
        );
        mode.isAddCarModeActive = false;
      }
      return;
    }

    if (
      !readOnly &&
      (mode.isAddPointModeActive ||
        mode.isAddPedestrianModeActive ||
        mode.isAddedPoints ||
        state.isBuildingMode)
    )
      return;

    const select = (
      object: THREE.Object3D,
      id = object.userData.id as string | undefined
    ) => {
      if (!id) return;
      const ids = additive
        ? state.selectedIds.includes(id)
          ? state.selectedIds.filter((selected) => selected !== id)
          : [...state.selectedIds, id]
        : [id];
      const selection = resolveSelection(state, ids);
      state.selectObjects(selection);
      tc.detach();
      if (!readOnly && selection.length === 1 && selection[0].id === id)
        tc.attach(object);
    };
    const startedAt = import.meta.env.DEV ? performance.now() : 0;
    const hits = ctx.raycaster.intersectObjects(
      pickableObjectsRef.current,
      true
    );
    if (import.meta.env.DEV) {
      const monitor = (
        window as Window & {
          __editorPerformanceMetrics?: {
            recordSelection: (durationMs: number) => void;
          };
        }
      ).__editorPerformanceMetrics;
      monitor?.recordSelection(performance.now() - startedAt);
    }
    if (hits.length) {
      let root = hits[0].object;
      while (
        root.parent &&
        (!root.userData.id || root.parent.userData.id === root.userData.id)
      )
        root = root.parent;
      select(root);
      return;
    }
    if (!additive) {
      state.clearSelection();
      tc.detach();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
