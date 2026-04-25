import { useCallback } from 'react';
import type { SharedMouseContext } from '../types/IMouseEventsTypes';

export function useMouseMoveHandler(ctx: SharedMouseContext) {
  return useCallback(
    (e: MouseEvent) => {
      e.preventDefault();
      ctx.setMouse(e);
    },
    [ctx],
  );
}
