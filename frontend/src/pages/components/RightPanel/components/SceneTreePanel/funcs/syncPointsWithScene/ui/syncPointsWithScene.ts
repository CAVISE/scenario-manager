import * as THREE from 'three';
import { syncPointsWithSceneProps } from '../types/syncPointsWithSceneTypes';

export function syncPointsWithScene({
  pointsArrRef,
  sceneRef,
}: syncPointsWithSceneProps) {
  if (!sceneRef.current) return;
  const pointsArr = pointsArrRef.current;
  if (!pointsArr) return;
  sceneRef.current.traverse((obj: THREE.Object3D) => {
    if (obj.userData.type === 'point') {
      const exists = pointsArr.some((p) => p.userData.id === obj.userData.id);
      if (!exists && obj instanceof THREE.Mesh) {
        pointsArr.push(obj);
      }
    }
  });
}
