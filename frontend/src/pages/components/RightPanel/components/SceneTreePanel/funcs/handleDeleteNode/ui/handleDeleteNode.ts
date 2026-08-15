import * as THREE from 'three';
import { disposeMesh } from '../../sceneUtils';
import { useEditorStore } from '../../../../../../../../store/ui/useEditorStore';
import { getTypeMeta } from '../../../types/SceneTreePanelTypes';
import { pushSingleDeletionSnapshot } from '../../deletionSnapshots';
import { handleDeleteNodeProps } from '../types/handleDeleteNodeTypes';

export function handleDeleteNode({
  id,
  name,
  e,
  carMeshesRef,
  cubeCirclesRef,
  pointsArrRef,
  pointsObjsRef,
  rsuMeshesRef,
  sceneRef,
  transformControlsRef,
  detachTransformControls,
  toast,
}: handleDeleteNodeProps) {
  e.stopPropagation();
  const s = useEditorStore.getState();
  const meta = getTypeMeta(name);
  const pushed = pushSingleDeletionSnapshot({ id, label: meta.label });

  if (meta.label === 'CAR') {
    const idx = carMeshesRef.current.findIndex((m) => m.userData.id === id);
    if (idx !== -1) {
      cubeCirclesRef.current[idx]?.forEach((c) => {
        c.parent?.remove(c);
        c.geometry?.dispose();
        (c.material as THREE.Material)?.dispose();
      });
      cubeCirclesRef.current.splice(idx, 1);

      const mesh = carMeshesRef.current[idx];
      disposeMesh(mesh);
      sceneRef.current?.remove(mesh);
      carMeshesRef.current.splice(idx, 1);
    }
    s.removeCar(id);
  } else if (meta.label === 'RSU') {
    const rsuIdx = s.RSUs.findIndex((r) => r.id === id);
    if (rsuIdx !== -1) {
      const meshIdx = pointsArrRef.current.findIndex(
        (m) => m.userData.id === id,
      );
      if (meshIdx !== -1) {
        const mesh = pointsArrRef.current[meshIdx];
        mesh.parent?.remove(mesh);
        mesh.geometry?.dispose();
        const materials = Array.isArray(mesh.material)
          ? mesh.material
          : [mesh.material];
        materials.forEach((mt) => mt?.dispose());
        pointsArrRef.current.splice(meshIdx, 1);
      }

      const objsIdx = pointsObjsRef.current.findIndex(
        (m) => m.userData.id === id,
      );
      if (objsIdx !== -1) pointsObjsRef.current.splice(objsIdx, 1);

      const rsuMeshIdx = rsuMeshesRef.current.findIndex(
        (m) => m.userData.id === id,
      );
      if (rsuMeshIdx !== -1) rsuMeshesRef.current.splice(rsuMeshIdx, 1);

      s.removeRSU(rsuIdx);
    }
  } else if (meta.label === 'BLD') {
    s.removeBuilding(id);
  } else if (meta.label === 'HMN') {
    s.removePedestrian(id);
  } else if (meta.label === 'WPT') {
    const pt = s.points.find((p) => p.id === id);
    if (pt) {
      for (let i = 0; i < cubeCirclesRef.current.length; i++) {
        const carPoints = s.points.filter((p) => p.carId === pt.carId);
        const j = carPoints.findIndex((p) => p.id === id);
        if (j !== -1 && cubeCirclesRef.current[i]?.[j]) {
          const c = cubeCirclesRef.current[i][j];
          c.parent?.remove(c);
          c.geometry?.dispose();
          (c.material as THREE.Material)?.dispose();
          cubeCirclesRef.current[i].splice(j, 1);
          break;
        }
      }
    }
    s.removePoint(id);
  } else if (meta.label === 'LDR') {
    s.removeLidar(id);
  }

  s.selectObject(null);
  transformControlsRef.current?.detach();
  detachTransformControls();

  if (pushed) {
    toast.undo(pushed.label, () =>
      useEditorStore.getState().restoreLastDeletion(pushed.snapshotId),
    );
  }
}
