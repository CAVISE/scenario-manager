import { useRef, useCallback } from 'react';
import * as THREE from 'three';

import { syncRoutePointMeshes as syncRoutePointMeshesInScene } from '@editor/scene/loaders/loadPoints';

import { UseSceneObjectsResult } from '../types/useSceneObjectsTypes';
import { useEditorStore } from '@/store';
import { useEditorRefs } from '@editor/context';
import { groupByCarId, getGroupedByCarId } from '@/shared/utils/groupByCarId';

export function useSceneObjects(): UseSceneObjectsResult {
  const { threeRef, routePointMeshesRef, roadMeshRef, transformControlsRef } =
    useEditorRefs();

  const localLineArrRef = useRef<THREE.Line[][]>([]);

  const syncRoutePointMeshes = useCallback(() => {
    const scene = threeRef.current?.scene;
    if (!scene) return;

    const { cars, points } = useEditorStore.getState();
    const pointsByCarId = groupByCarId(points);

    const result = syncRoutePointMeshesInScene({
      scene,
      cars,
      points: cars.map((car) => getGroupedByCarId(pointsByCarId, car.id)),
      routePointMeshes: routePointMeshesRef.current,
      lines: localLineArrRef.current,
      transformControlsRef,
    });

    routePointMeshesRef.current = result.routePointMeshes;
    localLineArrRef.current = result.lines;
  }, [routePointMeshesRef, threeRef, transformControlsRef]);

  const syncRoadMesh = useCallback(
    (roadMesh: THREE.Mesh | null) => {
      roadMeshRef.current = roadMesh;
    },
    [roadMeshRef]
  );

  return { syncRoutePointMeshes, syncRoadMesh, localLineArrRef };
}
