import * as THREE from 'three';
import { useEditorStore } from '@/store';
import {
  pushSingleDeletionSnapshot,
  watchSnapshotValidity,
} from '@right-panel/components/SceneTreePanel/funcs/deletionSnapshots';
import type { UseKeyDownHandlerProps } from '../types/IMouseEventsTypes';
import { disposeSceneObject } from './deleteSceneObject';

type DeleteRoutePointParams = {
  attached: THREE.Object3D;
  scene: THREE.Scene;
  routePointMeshes: THREE.Object3D[][];
  carMeshes: THREE.Object3D[];
  clearSelection: () => void;
  updateSceneGraph: () => void;
  toast: UseKeyDownHandlerProps['toast'];
};

export const deleteRoutePoint = ({
  attached,
  scene,
  routePointMeshes,
  carMeshes,
  clearSelection,
  updateSceneGraph,
  toast,
}: DeleteRoutePointParams) => {
  for (let carIndex = 0; carIndex < routePointMeshes.length; carIndex++) {
    const pointIndex = routePointMeshes[carIndex].findIndex(
      (mesh) => mesh === attached
    );
    if (pointIndex === -1) continue;
    const carId = carMeshes[carIndex]?.userData.id;
    const pointId = useEditorStore
      .getState()
      .points.filter((point) => point.carId === carId)[pointIndex]?.id;
    const mesh = routePointMeshes[carIndex][pointIndex];
    if (pointId) {
      const snapshot = pushSingleDeletionSnapshot({
        id: pointId,
        label: 'WPT',
      });
      scene.remove(mesh);
      disposeSceneObject(mesh);
      routePointMeshes[carIndex].splice(pointIndex, 1);
      useEditorStore.getState().removePoint(pointId);
      clearSelection();
      updateSceneGraph();
      if (snapshot)
        toast.undo(
          'Deleted WPT',
          () =>
            useEditorStore.getState().restoreLastDeletion(snapshot.snapshotId),
          undefined,
          watchSnapshotValidity(snapshot.snapshotId)
        );
    } else {
      scene.remove(mesh);
      disposeSceneObject(mesh);
      routePointMeshes[carIndex].splice(pointIndex, 1);
    }
    return;
  }
};
