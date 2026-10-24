import { useEditorStore } from '@/store';
import { deleteSelectedObjects } from '@right-panel/components/MultiSelectionProperties/model/batchActions';
import { watchHistoryEntryValidity } from '@right-panel/components/SceneTreePanel/funcs/deletionSnapshots/ui/deletionSnapshots';
import type { UseKeyDownHandlerProps } from '../types/IMouseEventsTypes';

export const deleteMultipleSelection = (
  detach: () => void,
  toast: UseKeyDownHandlerProps['toast']
) => {
  detach();
  const result = deleteSelectedObjects();
  if (result)
    toast.undo(
      `${result.count} objects deleted`,
      () => useEditorStore.getState().undo(),
      undefined,
      watchHistoryEntryValidity(result.entryId)
    );
};
