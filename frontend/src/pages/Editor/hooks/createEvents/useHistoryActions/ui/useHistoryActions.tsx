import { useCallback } from 'react';
import { useEditorStore } from '@/store';
import { useHooks, useEditorRefs } from '@editor/context';

export function useHistoryActions() {
  const { updateSceneGraph } = useHooks();
  const { transformControlsRef } = useEditorRefs();
  const onSelectObject = useEditorStore((s) => s.selectObject);

  const canUndo = useEditorStore((s) => s.historyCursor > 0);
  const canRedo = useEditorStore(
    (s) => s.historyCursor < s.historyStack.length
  );

  const withSceneRefresh = useCallback(
    (canApply: boolean, run: () => void) => {
      if (!canApply) return false;
      transformControlsRef.current?.detach();
      onSelectObject(null);
      run();
      updateSceneGraph();
      return true;
    },
    [transformControlsRef, onSelectObject, updateSceneGraph]
  );

  const undo = useCallback(
    () =>
      withSceneRefresh(canUndo, () => {
        useEditorStore.getState().undo();
      }),
    [withSceneRefresh, canUndo]
  );

  const redo = useCallback(
    () =>
      withSceneRefresh(canRedo, () => {
        useEditorStore.getState().redo();
      }),
    [withSceneRefresh, canRedo]
  );

  return { undo, redo, canUndo, canRedo };
}
