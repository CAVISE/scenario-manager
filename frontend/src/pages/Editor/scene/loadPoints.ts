import * as THREE from 'three';
import {segments, radius} from './types/loadPointsTypes';
import type { LoadPointsContext } from './types/loadPointsTypes';
import type { ConnectLinesContext } from './types/loadPointsTypes';
import { Vec3 } from '../types/editorTypes';

export function loadPoints(ctx: LoadPointsContext) {
  const { scene, points } = ctx;
  const cubeCircles = ctx.cubeCircles;
  let lines = ctx.lines;

  cubeCircles.forEach((circleArray, index) => {
    if (circleArray) {
      circleArray.forEach(circle => {
        circle.parent?.remove(circle);
        circle.geometry?.dispose();
        (Array.isArray(circle.material) ? circle.material : [circle.material as THREE.Material])
          .forEach(m => m?.dispose());
      });
      cubeCircles[index] = [];
    }
  });

  points.forEach((pointsArray, arrIndex) => {
    if (!cubeCircles[arrIndex]) cubeCircles[arrIndex] = [];

    pointsArray.forEach((point, pointIndex) => {
      const geometry = new THREE.CircleGeometry(radius, segments);
      const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const circle   = new THREE.Mesh(geometry, material);
      circle.userData = { type: 'circle', id: point.id, carId: point.carId };
      circle.position.set(point.x, point.y, point.z);
      scene.add(circle);
      cubeCircles[arrIndex].push(circle);

      const canvas = document.createElement('canvas');
      canvas.width = 64; canvas.height = 64;
      const ctx2d  = canvas.getContext('2d')!;
      ctx2d.fillStyle    = 'black';
      ctx2d.font         = 'bold 72px Arial';
      ctx2d.textAlign    = 'center';
      ctx2d.textBaseline = 'middle';
      ctx2d.strokeStyle  = 'black';
      ctx2d.fillText((pointIndex + 1).toString(), 32, 32);

      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true })
      );
      sprite.scale.set(2, 2, 1);
      sprite.position.set(0, 0, 1);
      circle.add(sprite);
    });
  });

  lines = connectCirclesWithLines({ scene, cars: ctx.cars, points, cubeCircles, lines });

  return { cubeCircles, lines };
}

export function connectCirclesWithLines(ctx: ConnectLinesContext): THREE.Line[][] {
  const { scene, cars, points } = ctx;
  let lines = ctx.lines;

  lines.flat().forEach(line => {
    line.parent?.remove(line);
    line.geometry?.dispose();
    if (Array.isArray(line.material)) {
      line.material.forEach(m => m.dispose());
    } else {
      (line.material as THREE.Material)?.dispose();
    }
  });

  if (lines.length !== cars.length) {
    lines = new Array(cars.length).fill(null).map(() => []);
  }

  function createAndAddLine(
    start: Vec3,
    end: Vec3,
    index: number
  ) {
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

    lines[ind].forEach(line => {
      line.parent?.remove(line);
      line.geometry?.dispose();
      if (Array.isArray(line.material)) {
        line.material.forEach(m => m.dispose());
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
