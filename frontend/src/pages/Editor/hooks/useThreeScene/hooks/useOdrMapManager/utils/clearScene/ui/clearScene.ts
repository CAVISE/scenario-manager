import * as THREE from 'three';
import { ClearSceneParams } from '../types/clearSceneTypes';
import { clearOdrScene } from '../../../../../../useOpenDriveUtils/useOdrMap';
import { useEditorStore } from '../../../../../../../../../store';

function disposeMesh(obj: THREE.Mesh) {
  obj.parent?.remove(obj);
  obj.geometry?.dispose();
  const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
  mats.forEach((m) => m?.dispose());
}

export function clearScene({
  three,
  odrMeshes,
  disposableObjs,
  localLineArrRef,
  carMeshesRef,
  pointsObjsRef,
  cubeCirclesRef,
  carQuaternionsRef,
  currentCarRef,
  currentColorRef,
  syncRoadMesh,
}: ClearSceneParams): void {
  const { scene, transformControls, picking } = three;

  clearOdrScene(scene, odrMeshes, picking.scenes, disposableObjs);

  carMeshesRef.current.forEach(disposeMesh);
  pointsObjsRef.current.forEach(disposeMesh);

  localLineArrRef.current.flat().forEach((l) => {
    l.parent?.remove(l);
    l.geometry?.dispose();
    (l.material as THREE.Material)?.dispose();
  });
  cubeCirclesRef.current.flat().forEach((c) => {
    c.parent?.remove(c);
    c.geometry?.dispose();
    (c.material as THREE.Material)?.dispose();
  });

  scene.children = scene.children.filter((c) => c.type !== 'Group');

  cubeCirclesRef.current.length = 0;
  carMeshesRef.current = [];
  localLineArrRef.current = [];
  pointsObjsRef.current = [];
  currentColorRef.current = '00ff00';
  currentCarRef.current = '';
  carQuaternionsRef.current.clear();

  transformControls.detach();
  transformControls.parent?.remove(transformControls);

  const s = useEditorStore.getState();
  while (useEditorStore.getState().RSUs.length > 0) {
    useEditorStore.getState().removeRSU(0);
  }
  s.points.forEach((p) => s.removePoint(p.id));
  s.cars.forEach((c) => s.removeCar(c.id.toString()));
  s.selectObject(null);

  syncRoadMesh(null);
}
