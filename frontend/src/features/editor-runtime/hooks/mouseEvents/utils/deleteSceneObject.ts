import * as THREE from 'three';
import { useEditorStore } from '@/store';
import {
  pushSingleDeletionSnapshot,
  watchSnapshotValidity,
} from '@right-panel/components/SceneTreePanel/funcs/deletionSnapshots';
import type { UseKeyDownHandlerProps } from '../types/IMouseEventsTypes';

export const disposeSceneObject = (object: THREE.Object3D) => {
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    child.geometry?.dispose();
    if (Array.isArray(child.material))
      child.material.forEach((material) => material.dispose());
    else child.material?.dispose();
  });
};

type DeleteSceneObjectParams = {
  id: string | undefined;
  label: string;
  object: THREE.Object3D;
  scene: THREE.Scene;
  deleteState: () => void;
  clearSelection: () => void;
  updateSceneGraph: () => void;
  toast: UseKeyDownHandlerProps['toast'];
};

export const deleteSceneObject = ({
  id,
  label,
  object,
  scene,
  deleteState,
  clearSelection,
  updateSceneGraph,
  toast,
}: DeleteSceneObjectParams) => {
  if (!id) return;
  const snapshot = pushSingleDeletionSnapshot({ id, label });
  scene.remove(object);
  disposeSceneObject(object);
  deleteState();
  clearSelection();
  updateSceneGraph();
  if (snapshot) {
    toast.undo(
      `Deleted ${label}`,
      () => useEditorStore.getState().restoreLastDeletion(snapshot.snapshotId),
      undefined,
      watchSnapshotValidity(snapshot.snapshotId)
    );
  }
};
