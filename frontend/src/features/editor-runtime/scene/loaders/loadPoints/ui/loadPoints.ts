import type { Vec3 } from '@/shared/types/sceneTypes';
import * as THREE from 'three';
import { POINT_RADIUS, POINT_SEGMENTS } from '../constants/loadPointsConstants';
import type {
  LoadPointsContext,
  ConnectLinesContext,
} from '../types/loadPointsTypes';

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
        routePointMesh.geometry?.dispose();
        (Array.isArray(routePointMesh.material)
          ? routePointMesh.material
          : [routePointMesh.material as THREE.Material]
        ).forEach((m) => m?.dispose());
      });
      routePointMeshes[index] = [];
    }
  });

  points.forEach((pointsArray, arrIndex) => {
    if (!routePointMeshes[arrIndex]) routePointMeshes[arrIndex] = [];

    pointsArray.forEach((point, pointIndex) => {
      const geometry = new THREE.CircleGeometry(POINT_RADIUS, POINT_SEGMENTS);
      const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const routePointMesh = new THREE.Mesh(geometry, material);
      routePointMesh.userData = {
        type: 'route-point',
        id: point.id,
        carId: point.carId,
      };
      routePointMesh.position.set(point.x, point.y, point.z);
      scene.add(routePointMesh);
      routePointMeshes[arrIndex].push(routePointMesh);

      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx2d = canvas.getContext('2d')!;
      ctx2d.fillStyle = 'black';
      ctx2d.font = 'bold 72px Arial';
      ctx2d.textAlign = 'center';
      ctx2d.textBaseline = 'middle';
      ctx2d.strokeStyle = 'black';
      ctx2d.fillText((pointIndex + 1).toString(), 32, 32);

      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: new THREE.CanvasTexture(canvas),
          transparent: true,
        })
      );
      sprite.scale.set(2, 2, 1);
      sprite.position.set(0, 0, 1);
      routePointMesh.add(sprite);

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
): THREE.Line[][] {
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
    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(start.x, start.y, start.z),
      new THREE.Vector3(end.x, end.y, end.z),
    ]);
    const material = new THREE.LineBasicMaterial({ color: 0x00ff00 });
    const line = new THREE.Line(geometry, material);
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
