import { useRef, useCallback } from 'react';
import * as THREE from 'three';

import { loadRSU as _loadRSU } from '@editor/scene/loaders/loadRSU';
import { loadPoints as _loadPoints } from '@editor/scene/loaders/loadPoints';

import {
  UseSceneObjectsProps,
  UseSceneObjectsResult,
} from '../types/useSceneObjectsTypes';
import { useEditorStore } from '@/store';
import { useEditorRefs } from '@editor/context';
import { groupByCarId, getGroupedByCarId } from '@/shared/utils/groupByCarId';

export function useSceneObjects({}: UseSceneObjectsProps): UseSceneObjectsResult {
  const {
    threeRef,

    cubeCirclesRef,
    roadMeshRef,
  } = useEditorRefs();

  const localLineArrRef = useRef<THREE.Line[][]>([]);

  const loadPoints = useCallback(() => {
    const scene = threeRef.current?.scene;
    if (!scene) return;

    const { cars, points } = useEditorStore.getState();
    const pointsByCarId = groupByCarId(points);

    const result = _loadPoints({
      scene,
      cars,
      points: cars.map((car) => getGroupedByCarId(pointsByCarId, car.id)),
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
    [roadMeshRef]
  );

  return { loadPoints, syncRoadMesh, localLineArrRef };
}
