import * as THREE from 'three';
import type { ClearSceneParams } from '../types/clearSceneTypes';
import { DEFAULT_COLOR } from '@editor/hooks/useThreeScene/constants/openDriveConstants';
import { clearOdrScene } from '@editor/hooks/useOpenDriveUtils/useOdrMap';
import { useEditorStore } from '@/store';

function disposeMesh(obj: THREE.Mesh) {
  obj.parent?.remove(obj);
  obj.geometry?.dispose();
  const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
  mats.forEach((m) => m?.dispose());
}

export function clearScene({
  three,
  odrMeshes,
  disposableGeometries,
  localLineArrRef,
  carMeshesRef,
  rsuObjectMeshesRef,
  routePointMeshesRef,
  carQuaternionsRef,
  currentCarRef,
  currentColorRef,
  syncRoadMesh,
}: ClearSceneParams): void {
  const { scene, transformControls, picking } = three;

  clearOdrScene(scene, odrMeshes, picking.scenes, disposableGeometries);

  carMeshesRef.current.forEach(disposeMesh);
  rsuObjectMeshesRef.current.forEach(disposeMesh);

  localLineArrRef.current.flat().forEach((l) => {
    l.parent?.remove(l);
    l.geometry?.dispose();
    (l.material as THREE.Material)?.dispose();
  });
  routePointMeshesRef.current.flat().forEach((routePointMesh) => {
    routePointMesh.parent?.remove(routePointMesh);
    routePointMesh.geometry?.dispose();
    (routePointMesh.material as THREE.Material)?.dispose();
  });

  scene.children = scene.children.filter((c) => c.type !== 'Group');

  routePointMeshesRef.current.length = 0;
  carMeshesRef.current = [];
  localLineArrRef.current = [];
  rsuObjectMeshesRef.current = [];
  currentColorRef.current = DEFAULT_COLOR;
  currentCarRef.current = '';
  carQuaternionsRef.current.clear();

  transformControls.detach();
  transformControls.parent?.remove(transformControls);

  const s = useEditorStore.getState();
  useEditorStore.getState().removeAllRSUs();
  s.points.forEach((p) => s.removePoint(p.id));
  s.cars.forEach((c) => s.removeCar(c.id.toString()));
  s.selectObjects([]);

  syncRoadMesh(null);
}
