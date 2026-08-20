import type {
  InactivityModeTimeoutHandle,
  InactivityModeTimeoutOptions,
} from '../types/useInactivityModeTimeoutTypes';

export function createInactivityModeTimeout({
  isModeActive,
  onTimeout,
  timeoutMs,
}: InactivityModeTimeoutOptions): InactivityModeTimeoutHandle {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  const scheduleReset = () => {
    cancel();
    timeoutId = setTimeout(() => {
      timeoutId = null;
      if (isModeActive()) {
        onTimeout();
      }
    }, timeoutMs);
  };

  return { scheduleReset, cancel };
}
