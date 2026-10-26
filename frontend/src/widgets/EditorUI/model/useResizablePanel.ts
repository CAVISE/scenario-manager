import { useCallback } from 'react';
import { clampPanelWidth } from './panelSize';

type Side = 'left' | 'right';

export function useResizablePanel(
  side: Side,
  width: number,
  onWidthChange: (width: number) => void
) {
  return useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      event.preventDefault();
      const startX = event.clientX;
      const onMove = (moveEvent: PointerEvent) => {
        const delta = moveEvent.clientX - startX;
        onWidthChange(
          clampPanelWidth(width + (side === 'left' ? delta : -delta))
        );
      };
      const onEnd = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onEnd);
      };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onEnd, { once: true });
    },
    [onWidthChange, side, width]
  );
}
