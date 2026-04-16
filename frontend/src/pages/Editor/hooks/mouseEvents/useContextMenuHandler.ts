import { useCallback } from 'react';
import { useEditorStore } from '../../../../store/useEditorStore';
import type { SharedMouseContext } from './types/IMouseEventsTypes';

export function useContextMenuHandler(
  ctx: SharedMouseContext,
) {
  return useCallback(
    (e: MouseEvent) => {
      if (ctx.insidePanel(e)) return;
      e.preventDefault();
      useEditorStore.getState().setBuildingMode(false);
    },
    [],
  );
}
