import { useCallback } from 'react';
import { useEditorStore } from '../../../../../../store';
import { UseEditorHandlersProps } from '../types/useEditorHandlersTypes';

export const useEditorHandlers = ({
  actionsRef,
  currentCarRef,
  modeRef,
  transformControlsRef,
}: UseEditorHandlersProps) => {
  const setBuildingMode = useEditorStore((s) => s.setBuildingMode);

  const handleAddCube = useCallback(() => {
    currentCarRef.current = '';
    actionsRef.current.addCube();
  }, [actionsRef, currentCarRef]);

  const handleAddRSU = useCallback(() => {
    actionsRef.current.addRSU();
  }, [actionsRef]);

  const handleAddPedestrian = useCallback(() => {
    actionsRef.current.addPedestrian();
  }, [actionsRef]);

  const handleDeleteCar = useCallback(() => {
    actionsRef.current.deleteCube();
  }, [actionsRef]);

  const handleAddPoints = useCallback(() => {
    actionsRef.current.addPoints();
  }, [actionsRef]);

  const detachTransformControls = useCallback(() => {
    transformControlsRef.current?.detach();
    useEditorStore.getState().selectObject(null);
  }, [transformControlsRef]);

  const handleSetBuildingMode = useCallback(
    (value: boolean) => {
      if (value) {
        modeRef.current.isAddPointModeActive = false;
        modeRef.current.isAddCarModeActive = false;
        modeRef.current.isAddedPoints = false;
        modeRef.current.isAddPedestrianModeActive = false;
      }
      setBuildingMode(value);
    },
    [modeRef, setBuildingMode],
  );

  return {
    handleAddCube,
    handleAddRSU,
    handleAddPedestrian,
    handleDeleteCar,
    handleAddPoints,
    detachTransformControls,
    handleSetBuildingMode,
  };
};
