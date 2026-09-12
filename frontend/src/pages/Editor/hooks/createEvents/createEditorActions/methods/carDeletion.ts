import * as THREE from 'three';
import { useEditorStore } from '@/store';
import {
  removeFromArray,
  disposeLine,
  disposeCircle,
  disposeMesh,
} from '../utils/resourceCleanup';

export const deleteCar = (
  carId: string,
  carMeshesRef: React.MutableRefObject<THREE.Mesh[]>,
  cubeCirclesRef: React.MutableRefObject<THREE.Mesh[][]>,
  localLineArrRef: React.MutableRefObject<THREE.Line[][]>,
  transformControls: { detach: () => void },
  loadPoints: () => void
): boolean => {
  const store = useEditorStore.getState();
  const idx = carMeshesRef.current.findIndex((m) => m.userData.id === carId);

  if (idx < 0) return false;

  const lines = removeFromArray(localLineArrRef.current, idx);
  lines?.forEach(disposeLine);

  const circles = removeFromArray(cubeCirclesRef.current, idx);
  circles?.forEach(disposeCircle);

  store.removePointsByCarId(carId);

  const mesh = removeFromArray(carMeshesRef.current, idx);
  if (mesh) {
    disposeMesh(mesh);
    store.removeCar(carId);
  }

  transformControls.detach();
  store.selectObjects([]);
  loadPoints();

  return true;
};
