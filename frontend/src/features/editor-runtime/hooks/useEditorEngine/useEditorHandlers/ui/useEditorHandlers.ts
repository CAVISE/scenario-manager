import { useCallback } from 'react';
import { useEditorStore } from '@/store';
import { UseEditorHandlersProps } from '../types/useEditorHandlersTypes';

export const useEditorHandlers = ({
  actionsRef,
  currentCarRef,
  modeRef,
  transformControlsRef,
}: UseEditorHandlersProps) => {
  const setBuildingMode = useEditorStore((s) => s.setBuildingMode);

  const handleAddCar = useCallback(() => {
    currentCarRef.current = '';
    actionsRef.current.addCar();
  }, [actionsRef, currentCarRef]);

  const handleAddRSU = useCallback(() => {
    actionsRef.current.addRSU();
  }, [actionsRef]);

  const handleAddPedestrian = useCallback(() => {
    actionsRef.current.addPedestrian();
  }, [actionsRef]);

  const handleDeleteCar = useCallback(() => {
    actionsRef.current.deleteCar();
  }, [actionsRef]);

  const handleStartRoutePointPlacement = useCallback(() => {
    actionsRef.current.startRoutePointPlacement();
  }, [actionsRef]);

  const detachTransformControls = useCallback(() => {
    transformControlsRef.current?.detach();
    useEditorStore.getState().selectObjects([]);
  }, [transformControlsRef]);

  const handleSetBuildingMode = useCallback(
    (value: boolean) => {
      if (value) {
        modeRef.current.isAddPointModeActive = false;
        modeRef.current.isAddCarModeActive = false;
        modeRef.current.isAddedPoints = false;
        modeRef.current.isAddPedestrianModeActive = false;
        transformControlsRef.current?.detach();
        useEditorStore.getState().selectObjects([]);
      }
      setBuildingMode(value);
    },
    [modeRef, setBuildingMode, transformControlsRef]
  );

  return {
    handleAddCar,
    handleAddRSU,
    handleAddPedestrian,
    handleDeleteCar,
    handleStartRoutePointPlacement,
    detachTransformControls,
    handleSetBuildingMode,
  };
};
