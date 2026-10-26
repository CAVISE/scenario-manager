import type { Vec3 } from '@/shared/types/sceneTypes';
import * as THREE from 'three';
import type {
  LoadPointsContext,
  ConnectLinesContext,
} from '../types/loadPointsTypes';
import {
  createRoutePointMarker,
  disposeRoutePointMarker,
} from '../utils/routePointMarker';
import { createRouteLine } from '../utils/routeLine';

export function syncRoutePointMeshes(ctx: LoadPointsContext) {
  const { scene, points, transformControlsRef } = ctx;
  const routePointMeshes = ctx.routePointMeshes;
  let lines = ctx.lines;

  const tc = transformControlsRef?.current;
  const attachedObj = (tc as unknown as { object?: THREE.Object3D } | null)
    ?.object;
  const attachedPointId =
    attachedObj?.userData?.type === 'route-point'
      ? (attachedObj.userData.id as string | undefined)
      : undefined;

  if (attachedPointId !== undefined && tc) {
    tc.detach();
  }

  routePointMeshes.forEach((routePointMeshGroup, index) => {
    if (routePointMeshGroup) {
      routePointMeshGroup.forEach((routePointMesh) => {
        routePointMesh.parent?.remove(routePointMesh);
        disposeRoutePointMarker(routePointMesh);
      });
      routePointMeshes[index] = [];
    }
  });

  points.forEach((pointsArray, arrIndex) => {
    if (!routePointMeshes[arrIndex]) routePointMeshes[arrIndex] = [];

    pointsArray.forEach((point, pointIndex) => {
      const routePointMesh = createRoutePointMarker(point, pointIndex);
      scene.add(routePointMesh);
      routePointMeshes[arrIndex].push(routePointMesh);

      if (attachedPointId !== undefined && point.id === attachedPointId) {
        tc?.attach(routePointMesh);
      }
    });
  });

  lines = connectRoutePointsWithLines({
    scene,
    cars: ctx.cars,
    points,
    routePointMeshes,
    lines,
  });

  return { routePointMeshes, lines };
}

export function connectRoutePointsWithLines(
  ctx: ConnectLinesContext
): THREE.Mesh[][] {
  const { scene, cars, points } = ctx;
  let lines = ctx.lines;

  lines.flat().forEach((line) => {
    line.parent?.remove(line);
    line.geometry?.dispose();
    if (Array.isArray(line.material)) {
      line.material.forEach((m) => m.dispose());
    } else {
      (line.material as THREE.Material)?.dispose();
    }
  });

  if (lines.length !== cars.length) {
    lines = new Array(cars.length).fill(null).map(() => []);
  }

  function createAndAddLine(start: Vec3, end: Vec3, index: number) {
    const line = createRouteLine(start, end);
    scene.add(line);
    lines[index].push(line);
  }

  points.forEach((pointsArray, ind) => {
    if (ind >= cars.length) return;
    if (!lines[ind]) lines[ind] = [];

    lines[ind].forEach((line) => {
      line.parent?.remove(line);
      line.geometry?.dispose();
      if (Array.isArray(line.material)) {
        line.material.forEach((m) => m.dispose());
      } else {
        (line.material as THREE.Material)?.dispose();
      }
    });
    lines[ind] = [];

    if (pointsArray.length < 1) return;

    createAndAddLine(cars[ind], pointsArray[0], ind);
    for (let i = 1; i < pointsArray.length; i++) {
      createAndAddLine(pointsArray[i - 1], pointsArray[i], ind);
    }
  });

  return lines;
}
