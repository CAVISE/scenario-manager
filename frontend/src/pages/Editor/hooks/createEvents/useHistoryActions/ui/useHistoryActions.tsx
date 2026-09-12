import { useCallback } from 'react';
import { useEditorStore } from '@/store';
import { useHooks, useEditorRefs } from '@editor/context';
import { flushPendingHistory } from '../../createHistoryTracker/ui/createHistoryTracker';

export function useHistoryActions() {
  const { updateSceneGraph } = useHooks();
  const { transformControlsRef } = useEditorRefs();
  const onSelectObjects = useEditorStore((s) => s.selectObjects);

  const canUndo = useEditorStore((s) => s.historyCursor > 0);
  const canRedo = useEditorStore(
    (s) => s.historyCursor < s.historyStack.length
  );

  const withSceneRefresh = useCallback(
    (canApply: boolean, run: () => void) => {
      if (useEditorStore.getState().simulationSession.phase === 'running')
        return false;
      if (!canApply) return false;
      transformControlsRef.current?.detach();
      onSelectObjects([]);
      run();
      updateSceneGraph();
      return true;
    },
    [transformControlsRef, onSelectObjects, updateSceneGraph]
  );

  const undo = useCallback(() => {
    flushPendingHistory();
    return withSceneRefresh(useEditorStore.getState().canUndo(), () => {
      useEditorStore.getState().undo();
    });
  }, [withSceneRefresh]);

  const redo = useCallback(() => {
    flushPendingHistory();
    return withSceneRefresh(useEditorStore.getState().canRedo(), () => {
      useEditorStore.getState().redo();
    });
  }, [withSceneRefresh]);

  return { undo, redo, canUndo, canRedo };
}
