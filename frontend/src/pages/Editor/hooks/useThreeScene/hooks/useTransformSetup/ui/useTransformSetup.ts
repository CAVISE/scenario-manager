import { useEffect, useRef } from 'react';
import {
  UseTransformSetupProps,
  UseTransformSetupResult,
} from '../types/useTransformSetupTypes';

export function useTransformSetup({
  transformControls,
  isDraggingRef,
}: UseTransformSetupProps): UseTransformSetupResult {
  const isDraggingLocalRef = useRef(false);

  useEffect(() => {
    if (!transformControls) return;

    function onMouseDown() {
      isDraggingLocalRef.current = true;
      if (isDraggingRef) isDraggingRef.current = true;
    }

    function onMouseUp() {
      isDraggingLocalRef.current = false;
      if (isDraggingRef) isDraggingRef.current = false;
    }

    transformControls.addEventListener('mouseDown' as never, onMouseDown);
    transformControls.addEventListener('mouseUp' as never, onMouseUp);

    return () => {
      transformControls.removeEventListener('mouseDown' as never, onMouseDown);
      transformControls.removeEventListener('mouseUp' as never, onMouseUp);
    };
  }, [transformControls, isDraggingRef]);

  const getIsDragging = useRef(() => isDraggingLocalRef.current).current;

  return { getIsDragging };
}
