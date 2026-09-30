import type { MutableRefObject } from 'react';
import { useEditorStore } from '@/store';
import type { ModeName, ModeRef } from '../types/createEditorActionsTypes';

export const resetModes = (modeRef: MutableRefObject<ModeRef>): void => {
  modeRef.current.isAddCarModeActive = false;
  modeRef.current.isAddPointModeActive = false;
  modeRef.current.isAddedPoints = false;
  modeRef.current.isAddPedestrianModeActive = false;
  useEditorStore.getState().setBuildingMode(false);
};

export const setMode = (
  modeRef: MutableRefObject<ModeRef>,
  mode: ModeName
): void => {
  resetModes(modeRef);

  switch (mode) {
    case 'CAR':
      modeRef.current.isAddCarModeActive = true;
      break;
    case 'RSU':
      modeRef.current.isAddPointModeActive = true;
      break;
    case 'PEDESTRIAN':
      modeRef.current.isAddPedestrianModeActive = true;
      break;
    case 'DIRECTION_POINTS':
      if (useEditorStore.getState().selectedIds[0]) {
        modeRef.current.isAddedPoints = true;
      }
      break;
    case 'POINT':
      break;
  }
};
