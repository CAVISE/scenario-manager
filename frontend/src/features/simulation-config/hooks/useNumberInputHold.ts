import { useEffect, type RefObject } from 'react';

export function useNumberInputHold(
  containerRef: RefObject<HTMLDivElement | null>,
  open: boolean
) {
  useEffect(() => {
    const container = containerRef.current;
    if (!open || !container) return undefined;

    let activeInput: HTMLInputElement | null = null;
    let holdDelayTimeout: number | null = null;
    let holdInterval: number | null = null;
    let step = 1;
    let minimum: number | undefined;
    let maximum: number | undefined;
    const clearHoldTimers = () => {
      if (holdDelayTimeout !== null) window.clearTimeout(holdDelayTimeout);
      if (holdInterval !== null) window.clearInterval(holdInterval);
      holdDelayTimeout = null;
      holdInterval = null;
    };
    const stopHolding = () => {
      clearHoldTimers();
      activeInput = null;
    };
    const stepInput = () => {
      if (!activeInput) return;
      const currentValue = Number(activeInput.value);
      const nextValue =
        (Number.isFinite(currentValue) ? currentValue : 0) + step;
      const clampedValue = Math.min(
        maximum ?? Number.POSITIVE_INFINITY,
        Math.max(minimum ?? Number.NEGATIVE_INFINITY, nextValue)
      );
      activeInput.value = String(clampedValue);
      activeInput.dispatchEvent(new Event('input', { bubbles: true }));
      activeInput.dispatchEvent(new Event('change', { bubbles: true }));
    };
    const startHolding = (event: Event) => {
      const input = (event.target as HTMLElement | null)?.closest(
        'input[type="number"]'
      ) as HTMLInputElement | null;
      if (!input) return;
      stopHolding();
      activeInput = input;
      minimum = input.min ? Number(input.min) : undefined;
      maximum = input.max ? Number(input.max) : undefined;
      step = Number(input.step || 1);
      step = Number.isFinite(step) && step > 0 ? step : 1;
      holdDelayTimeout = window.setTimeout(() => {
        holdDelayTimeout = null;
        if (!activeInput) return;
        stepInput();
        holdInterval = window.setInterval(stepInput, 90);
      }, 350);
    };
    container.addEventListener('mousedown', startHolding as EventListener);
    container.addEventListener('touchstart', startHolding as EventListener);
    container.addEventListener('mouseleave', stopHolding as EventListener);
    window.addEventListener('mouseup', stopHolding);
    window.addEventListener('touchend', stopHolding);
    return () => {
      stopHolding();
      container.removeEventListener('mousedown', startHolding as EventListener);
      container.removeEventListener(
        'touchstart',
        startHolding as EventListener
      );
      container.removeEventListener('mouseleave', stopHolding as EventListener);
      window.removeEventListener('mouseup', stopHolding);
      window.removeEventListener('touchend', stopHolding);
    };
  }, [containerRef, open]);
}
