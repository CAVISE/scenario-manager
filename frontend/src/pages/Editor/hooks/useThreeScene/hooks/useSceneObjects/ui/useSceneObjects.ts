import { useRef, useCallback } from 'react';
import * as THREE from 'three';

import { loadRSU as _loadRSU } from '../../../../../scene/loaders/loadRSU';
import { loadPoints as _loadPoints } from '../../../../../scene/loaders/loadPoints';
import { useEditorRefs } from '../../../../../context';
import { useEditorStore } from '../../../../../../../store';
import {
  UseSceneObjectsProps,
  UseSceneObjectsResult,
} from '../types/useSceneObjectsTypes';

export function useSceneObjects({
  updateSceneGraph,
}: UseSceneObjectsProps): UseSceneObjectsResult {
  const {
    threeRef,
    modeRef,
    pointsArrRef,
    pointsObjsRef,
    cubeCirclesRef,
    roadMeshRef,
  } = useEditorRefs();

  const localLineArrRef = useRef<THREE.Line[][]>([]);

  const loadRSU = useCallback(() => {
    const scene = threeRef.current?.scene;
    if (!scene) return;

    pointsObjsRef.current.forEach((obj) => {
      if (obj.userData.type !== 'point') return;
      obj.parent?.remove(obj);
      obj.geometry?.dispose();
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      mats.forEach((m) => m?.dispose());
    });
    pointsObjsRef.current.length = 0;
    pointsArrRef.current.length = 0;

    const result = _loadRSU({
      scene,
      RSUs: useEditorStore.getState().RSUs,
      points_arr: pointsArrRef.current,
      points_objs: pointsObjsRef.current,
      isAddPointModeActive: modeRef.current.isAddPointModeActive,
      updateSceneGraph,
    });

    pointsArrRef.current.push(...result.points_arr);
    pointsObjsRef.current.push(...result.points_objs);
    modeRef.current.isAddPointModeActive = result.isAddPointModeActive;
  }, [updateSceneGraph, modeRef, pointsArrRef, pointsObjsRef, threeRef]);

  const loadPoints = useCallback(() => {
    const scene = threeRef.current?.scene;
    if (!scene) return;

    const { cars, points } = useEditorStore.getState();

    const result = _loadPoints({
      scene,
      cars,
      points: cars.map((car) => points.filter((p) => p.carId === car.id)),
      cubeCircles: cubeCirclesRef.current,
      lines: localLineArrRef.current,
    });

    cubeCirclesRef.current = result.cubeCircles;
    localLineArrRef.current = result.lines;
  }, [cubeCirclesRef, threeRef]);

  const syncRoadMesh = useCallback(
    (roadMesh: THREE.Mesh | null) => {
      roadMeshRef.current = roadMesh;
    },
    [roadMeshRef],
  );

  return { loadRSU, loadPoints, syncRoadMesh, localLineArrRef };
}
