import { useRef } from 'react';
import { useEditorStore } from '@/store';

import {
  createInactivityModeTimeout,
  type InactivityModeTimeoutHandle,
} from './createInactivityModeTimeout';

const TIMEOUT_MS = 30_000;

type ModeRef = {
  current: {
    isAddPointModeActive: boolean;
    isAddPedestrianModeActive: boolean;
    isAddedPoints: boolean;
  };
};

const useTimer = (isModeActive: () => boolean, onTimeout: () => void) => {
  const timerRef = useRef<InactivityModeTimeoutHandle | null>(null);
  if (!timerRef.current) {
    timerRef.current = createInactivityModeTimeout({
      isModeActive,
      onTimeout,
      timeoutMs: TIMEOUT_MS,
    });
  }
  return timerRef;
};

export const useAddModeInactivityTimers = (modeRef: ModeRef) => ({
  rsu: useTimer(
    () => modeRef.current.isAddPointModeActive,
    () => {
      modeRef.current.isAddPointModeActive = false;
    }
  ),
  pedestrian: useTimer(
    () => modeRef.current.isAddPedestrianModeActive,
    () => {
      modeRef.current.isAddPedestrianModeActive = false;
    }
  ),
  building: useTimer(
    () => useEditorStore.getState().isBuildingMode,
    () => useEditorStore.getState().setBuildingMode(false)
  ),
  waypoint: useTimer(
    () => modeRef.current.isAddedPoints,
    () => {
      modeRef.current.isAddedPoints = false;
    }
  ),
});
