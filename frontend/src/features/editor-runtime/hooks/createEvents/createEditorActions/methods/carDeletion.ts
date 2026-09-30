import * as THREE from 'three';
import { useEditorStore } from '@/store';
import {
  removeFromArray,
  disposeLine,
  disposeRoutePointMesh,
  disposeMesh,
} from '../utils/resourceCleanup';

export const deleteCar = (
  carId: string,
  carMeshesRef: React.MutableRefObject<THREE.Mesh[]>,
  routePointMeshesRef: React.MutableRefObject<THREE.Mesh[][]>,
  localLineArrRef: React.MutableRefObject<THREE.Line[][]>,
  transformControls: { detach: () => void },
  syncRoutePointMeshes: () => void
): boolean => {
  const store = useEditorStore.getState();
  const idx = carMeshesRef.current.findIndex((m) => m.userData.id === carId);

  if (idx < 0) return false;

  const lines = removeFromArray(localLineArrRef.current, idx);
  lines?.forEach(disposeLine);

  const routePointMeshes = removeFromArray(routePointMeshesRef.current, idx);
  routePointMeshes?.forEach(disposeRoutePointMesh);

  store.removePointsByCarId(carId);

  const mesh = removeFromArray(carMeshesRef.current, idx);
  if (mesh) {
    disposeMesh(mesh);
    store.removeCar(carId);
  }

  transformControls.detach();
  store.selectObjects([]);
  syncRoutePointMeshes();

  return true;
};
