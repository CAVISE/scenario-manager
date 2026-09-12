import { useCallback } from 'react';
import { useEditorStore } from '../../../../../store';
import type { SharedMouseContext } from '../mouse-events.types';

export function useContextMenuHandler(ctx: SharedMouseContext) {
  return useCallback(
    (e: MouseEvent) => {
      if (!ctx.insideEditorCanvas(e)) return;
      e.preventDefault();
      useEditorStore.getState().setBuildingMode(false);
    },
    [ctx],
  );
}
