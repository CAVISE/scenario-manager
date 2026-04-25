import { useCallback } from 'react';
import * as THREE from 'three';
import { useEditorStore } from '../../../../../store';
import type { SharedMouseContext } from '../types/IMouseEventsTypes';
import { useHooks, useEditorRefs } from '../../../context';

export function useDblClickHandler(ctx: SharedMouseContext) {
  const { buildingModelRef, updateSceneGraph } = useHooks();
  const {
    sceneRef,
    cameraRef,
    loadPointsRef,
    transformControlsRef,
    carMeshesRef,
    pointsArrRef,
    roadMeshRef,
    cubeCirclesRef,
    modeRef,
  } = useEditorRefs();
  return useCallback(
    (e: MouseEvent) => {
      const transformControls = transformControlsRef.current;
      if (!transformControls) return;
      const scene = sceneRef.current;
      if (!scene) return;
      if (ctx.insidePanel(e)) return;
      const camera = cameraRef.current;
      if (!camera) return;
      e.preventDefault();
      e.stopPropagation();
      const road = roadMeshRef.current;
      if (!road) return;
      ctx.setMouse(e);
      ctx.raycaster.setFromCamera(ctx.mouse, camera);

      const mode = modeRef.current;
      const carMeshes = carMeshesRef.current;
      const pointsArr = pointsArrRef.current;
      const cubeCircles = cubeCirclesRef.current;
      const intersects = ctx.raycaster.intersectObjects([
        ...carMeshes,
        ...cubeCircles.flat(),
        ...pointsArr,
      ]);

      if (mode.isAddPointModeActive) {
        const addAt = (x: number, y: number, z: number) => {
          useEditorStore.getState().addRSU(x, y, z);
        };
        if (intersects.length > 0 && intersects[0].object === road) {
          const pt = intersects[0].point;
          addAt(pt.x, pt.y, pt.z);
        } else if (intersects.length === 0) {
          const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
          const pt = new THREE.Vector3();
          if (ctx.raycaster.ray.intersectPlane(plane, pt))
            addAt(pt.x, pt.y, pt.z);
        }
        return;
      }

      if (mode.isAddPedestrianModeActive) {
        const addAt = (x: number, y: number, z: number) => {
          useEditorStore.getState().addPedestrian(x, y, z);
        };

        const roadHits = ctx.raycaster.intersectObjects([road], true);

        if (roadHits.length > 0) {
          const pt = roadHits[0].point;
          addAt(pt.x, pt.y, pt.z);
        } else if (intersects.length === 0) {
          const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
          const pt = new THREE.Vector3();
          if (ctx.raycaster.ray.intersectPlane(plane, pt)) {
            addAt(pt.x, pt.y, pt.z);
          }
        }
        mode.isAddPedestrianModeActive = false;
        return;
      }

      const currentSelectedId = useEditorStore.getState().selectedId;
      const selectedIdx = carMeshes.findIndex(
        (m) => m.userData.id === currentSelectedId,
      );
      if (selectedIdx >= 0 && mode.isAddedPoints) {
        e.preventDefault();
        const roadHits = ctx.raycaster.intersectObjects(
          [...carMeshes, ...cubeCircles.flat(), ...pointsArr, road],
          true,
        );
        if (roadHits.length > 0 && roadHits[0].object === road) {
          if (cubeCircles[selectedIdx]) {
            cubeCircles[selectedIdx].forEach((c) => {
              c.parent?.remove(c);
              c.geometry?.dispose();
              (c.material as THREE.Material)?.dispose();
            });
            cubeCircles[selectedIdx] = [];
          }
          const pt = roadHits[0].point;
          if (currentSelectedId)
            useEditorStore
              .getState()
              .addPoint(currentSelectedId, pt.x, pt.y, pt.z);
          loadPointsRef.current();
          updateSceneGraph();
        }
        return;
      }

      const { isBuildingMode } = useEditorStore.getState();
      if (isBuildingMode && !mode.isAddPointModeActive && !mode.isAddedPoints) {
        const model = buildingModelRef.current;
        if (!model) return;
        const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
        const pt = new THREE.Vector3();
        if (!ctx.raycaster.ray.intersectPlane(plane, pt)) return;
        pt.z = 0;
        const mesh = model.clone(true);
        mesh.userData = { type: 'building', id: `building_${Date.now()}` };
        mesh.position.copy(pt);
        scene.add(mesh);
        useEditorStore.getState().addBuilding(pt.x, pt.y, pt.z);
        const all = useEditorStore.getState().buildings;
        mesh.userData.id = all[all.length - 1]?.id;
        updateSceneGraph();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ctx, updateSceneGraph, buildingModelRef],
  );
}
