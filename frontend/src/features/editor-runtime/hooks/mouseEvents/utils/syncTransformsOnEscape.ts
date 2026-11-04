import * as THREE from 'three';
import { useEditorStore } from '@/store';
import { getGroupedByCarId, groupByCarId } from '@/shared/utils/groupByCarId';

type SyncTransformsOnEscapeParams = {
  carMeshes: THREE.Object3D[];
  routePointMeshes: THREE.Object3D[][];
  detach: () => void;
  clearSelection: () => void;
  mode: { isAddedPoints: boolean };
};

export const syncTransformsOnEscape = ({
  carMeshes,
  routePointMeshes,
  detach,
  clearSelection,
  mode,
}: SyncTransformsOnEscapeParams) => {
  clearSelection();
  detach();
  const store = useEditorStore.getState();
  carMeshes.forEach((mesh) => {
    store.updateCar(mesh.userData.id, {
      x: mesh.position.x,
      y: mesh.position.y,
      z: mesh.position.z,
      rotation: mesh.rotation.z,
      scale: mesh.scale.x,
    });
  });
  const pointsByCarId = groupByCarId(store.points);
  routePointMeshes.forEach((meshes, carIndex) => {
    const carId = carMeshes[carIndex]?.userData.id;
    const points = carId ? getGroupedByCarId(pointsByCarId, carId) : [];
    meshes.forEach((mesh, pointIndex) => {
      if (points[pointIndex])
        store.updatePoint(points[pointIndex].id, {
          x: mesh.position.x,
          y: mesh.position.y,
          z: mesh.position.z,
        });
    });
  });
  mode.isAddedPoints = false;
};
