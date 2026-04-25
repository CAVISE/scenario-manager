import { useState, useCallback } from 'react';
import { TransformControls } from 'three-stdlib';
import type { TransformMode } from '../types/useTransformModeTypes';
export function useTransformMode(
  transformControlsRef: React.RefObject<TransformControls | undefined>,
) {
  const [transformMode, setTransformMode] =
    useState<TransformMode>('translate');

  const handleSetMode = useCallback(
    (mode: TransformMode) => {
      if (transformControlsRef.current) {
        transformControlsRef.current.setMode(mode);
        setTransformMode(mode);
      }
    },
    [transformControlsRef],
  );

  return { transformMode, handleSetMode };
}
