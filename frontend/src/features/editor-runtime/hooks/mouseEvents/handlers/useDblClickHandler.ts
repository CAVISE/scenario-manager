import { useCallback } from 'react';
import * as THREE from 'three';
import { useEditorStore } from '@/store';
import type { SharedMouseContext } from '../types/IMouseEventsTypes';
import { useHooks, useEditorRefs } from '@editor/context';
import { useAppToast } from '@/shared/ui/AppToast';

import { checkObjectOverlap } from '@editor/scene/utils/checkObjectOverlap';
import {
  footprintIntersectsRoad,
  getBuildingFootprint,
} from '../utils/buildingPlacement';
import { useAddModeInactivityTimers } from '../utils/useAddModeInactivityTimers';

export function useDblClickHandler(ctx: SharedMouseContext) {
  const { buildingModelRef, updateSceneGraph } = useHooks();
  const toast = useAppToast();
  const {
    sceneRef,
    cameraRef,
    transformControlsRef,
    carMeshesRef,
    rsuRenderMeshesRef,
    roadMeshRef,
    routePointMeshesRef,
    rsuMeshesRef,
    pedestrianMeshesRef,
    modeRef,
  } = useEditorRefs();

  const timers = useAddModeInactivityTimers(modeRef);

  return useCallback(
    (e: MouseEvent) => {
      if (useEditorStore.getState().simulationSession.phase === 'running')
        return;
      if (!ctx.insideEditorCanvas(e)) return;
      const transformControls = transformControlsRef.current;
      if (!transformControls) return;
      const scene = sceneRef.current;
      if (!scene) return;
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
      const rsuRenderMeshes = rsuRenderMeshesRef.current;
      const routePointMeshes = routePointMeshesRef.current;
      const intersects = ctx.raycaster.intersectObjects(
        [...carMeshes, ...routePointMeshes.flat(), ...rsuRenderMeshes],
        true
      );

      if (mode.isAddPointModeActive) {
        const addAt = (x: number, y: number, z: number) => {
          useEditorStore.getState().addRSU(x, y, z);
          timers.rsu.current?.scheduleReset();
        };
        if (intersects.length > 0) return;

        const [roadHit] = ctx.raycaster.intersectObject(road, true);
        if (roadHit) {
          const pt = roadHit.point;
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
          timers.pedestrian.current?.scheduleReset();
        };

        if (intersects.length > 0) return;

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
        return;
      }

      const currentSelectedId = useEditorStore.getState().selectedIds[0];
      const selectedIdx = carMeshes.findIndex(
        (m) => m.userData.id === currentSelectedId
      );
      if (selectedIdx >= 0 && mode.isAddedPoints) {
        e.preventDefault();
        const roadHits = ctx.raycaster.intersectObjects(
          [...carMeshes, ...routePointMeshes.flat(), ...rsuRenderMeshes, road],
          true
        );
        if (roadHits.length > 0 && roadHits[0].object === road) {
          const pt = roadHits[0].point;
          if (currentSelectedId) {
            useEditorStore
              .getState()
              .addPoint(currentSelectedId, pt.x, pt.y, pt.z);
            timers.waypoint.current?.scheduleReset();
          }
          updateSceneGraph();
        }
        return;
      }

      const { isBuildingMode } = useEditorStore.getState();
      if (isBuildingMode && !mode.isAddPointModeActive && !mode.isAddedPoints) {
        const model = buildingModelRef.current;
        if (!model) return;

        const otherObjectHits = ctx.raycaster.intersectObjects(
          [
            ...carMeshes,
            ...routePointMeshes.flat(),
            ...rsuRenderMeshes,
            ...rsuMeshesRef.current,
            ...pedestrianMeshesRef.current,
          ],
          true
        );
        if (otherObjectHits.length > 0) return;

        const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
        const pt = new THREE.Vector3();
        if (!ctx.raycaster.ray.intersectPlane(plane, pt)) return;
        pt.z = 0;

        const newFootprint = getBuildingFootprint(model, pt.x, pt.y, 0.5, 0);

        if (footprintIntersectsRoad(newFootprint, road)) {
          toast.info(
            "Can't place building: it would overlap the road. Try a spot further from the road."
          );
          return;
        }

        const existingBuildings = useEditorStore.getState().buildings;
        const overlapsExisting = existingBuildings.some((building) => {
          const existingFootprint = getBuildingFootprint(
            model,
            building.x,
            building.y,
            building.scale ?? 0.5,
            building.rotation ?? 0
          );
          return checkObjectOverlap(newFootprint, existingFootprint).overlaps;
        });
        if (overlapsExisting) {
          toast.info(
            "Can't place building: it would overlap another building. Try a spot further away."
          );
          return;
        }

        useEditorStore.getState().addBuilding(pt.x, pt.y, pt.z);
        timers.building.current?.scheduleReset();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ctx, updateSceneGraph, buildingModelRef, toast]
  );
}
