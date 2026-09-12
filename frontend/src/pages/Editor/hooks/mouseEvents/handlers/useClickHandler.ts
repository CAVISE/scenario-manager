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
    carMeshesRef,
    cubeCirclesRef,
    modeRef,
    currentCarRef,
    currentColorRef,
    rsuMeshesRef,
    pedestrianMeshesRef,
  } = useEditorRefs();

  return useCallback((event: MouseEvent) => {
    if (!ctx.insideEditorCanvas(event)) return;
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
      const hits = ctx.raycaster.intersectObjects(
        [...carMeshesRef.current, road],
        true
      );
      if (hits[0]?.object === road) {
        if (!currentCarRef.current)
          currentCarRef.current = 'car_' + Math.floor(Math.random() * 1000);
        const point = hits[0].point;
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
    const lidarMeshes: THREE.Object3D[] = [];
    carMeshesRef.current.forEach((car) =>
      car.traverse((child) => {
        if (
          child.userData.type === 'lidar' &&
          child.parent?.userData.type !== 'lidar'
        )
          lidarMeshes.push(child);
      })
    );
    const candidates = [
      ...lidarMeshes,
      ...carMeshesRef.current,
      ...rsuMeshesRef.current,
      ...cubeCirclesRef.current.flat(),
      ...pedestrianMeshesRef.current,
      ...scene.children.filter((object) => object.userData.type === 'building'),
    ];
    const hits = ctx.raycaster.intersectObjects(candidates, true);
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
