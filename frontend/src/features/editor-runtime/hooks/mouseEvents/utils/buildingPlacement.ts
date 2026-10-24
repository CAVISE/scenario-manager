import * as THREE from 'three';
import type { Footprint2D } from '@editor/scene/utils/checkObjectOverlap';

let cachedRoad: THREE.Object3D | null = null;
let cachedRoadBox: THREE.Box3 | null = null;
let cachedModel: THREE.Object3D | null = null;
let cachedModelSize: THREE.Vector3 | null = null;

const getRoadBox = (road: THREE.Object3D) => {
  if (cachedRoad !== road || !cachedRoadBox) {
    cachedRoad = road;
    cachedRoadBox = new THREE.Box3().setFromObject(road);
  }
  return cachedRoadBox;
};

export const getBuildingFootprint = (
  model: THREE.Object3D,
  x: number,
  y: number,
  scale: number,
  rotation: number
): Footprint2D => {
  if (cachedModel !== model || !cachedModelSize) {
    const clone = model.clone(true);
    clone.position.set(0, 0, 0);
    clone.rotation.set(0, 0, 0);
    clone.scale.set(1, 1, 1);
    clone.updateMatrixWorld(true);
    cachedModel = model;
    cachedModelSize = new THREE.Box3()
      .setFromObject(clone)
      .getSize(new THREE.Vector3());
  }
  return {
    centerX: x,
    centerY: y,
    halfExtentX: (cachedModelSize.x * scale) / 2,
    halfExtentY: (cachedModelSize.z * scale) / 2,
    rotation,
  };
};

export const footprintIntersectsRoad = (
  footprint: Footprint2D,
  road: THREE.Object3D
) => {
  const roadBox = getRoadBox(road);
  const bounds = new THREE.Box2(
    new THREE.Vector2(
      footprint.centerX - footprint.halfExtentX,
      footprint.centerY - footprint.halfExtentY
    ),
    new THREE.Vector2(
      footprint.centerX + footprint.halfExtentX,
      footprint.centerY + footprint.halfExtentY
    )
  );
  if (
    !bounds.intersectsBox(
      new THREE.Box2(
        new THREE.Vector2(roadBox.min.x, roadBox.min.y),
        new THREE.Vector2(roadBox.max.x, roadBox.max.y)
      )
    )
  )
    return false;
  const raycaster = new THREE.Raycaster();
  const cos = Math.cos(footprint.rotation),
    sin = Math.sin(footprint.rotation);
  // A bounded grid keeps placement responsive for large imported models while
  // still sampling edges and the whole footprint after the cheap bbox reject.
  const dx = Math.min(8, Math.max(1, Math.ceil(2 * footprint.halfExtentX)));
  const dy = Math.min(8, Math.max(1, Math.ceil(2 * footprint.halfExtentY)));
  for (let i = 0; i <= dx; i++)
    for (let j = 0; j <= dy; j++) {
      const x = -footprint.halfExtentX + (2 * footprint.halfExtentX * i) / dx;
      const y = -footprint.halfExtentY + (2 * footprint.halfExtentY * j) / dy;
      raycaster.set(
        new THREE.Vector3(
          footprint.centerX + x * cos - y * sin,
          footprint.centerY + x * sin + y * cos,
          1000
        ),
        new THREE.Vector3(0, 0, -1)
      );
      if (raycaster.intersectObject(road, true).length) return true;
    }
  return false;
};
