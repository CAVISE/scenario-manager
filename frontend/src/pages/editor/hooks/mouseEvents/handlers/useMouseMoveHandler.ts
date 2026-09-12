import { useCallback } from 'react';
import type { SharedMouseContext } from '../mouse-events.types';

export function useMouseMoveHandler(ctx: SharedMouseContext) {
  return useCallback(
    (e: MouseEvent) => {
      if (!ctx.insideEditorCanvas(e)) return;
      e.preventDefault();
      ctx.setMouse(e);
    },
    [ctx],
  );
}
