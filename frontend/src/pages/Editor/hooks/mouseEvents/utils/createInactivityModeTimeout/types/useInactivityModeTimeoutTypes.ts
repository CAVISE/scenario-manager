export interface InactivityModeTimeoutOptions {
  isModeActive: () => boolean;
  onTimeout: () => void;
  timeoutMs: number;
}

export interface InactivityModeTimeoutHandle {
  scheduleReset: () => void;
  cancel: () => void;
}
