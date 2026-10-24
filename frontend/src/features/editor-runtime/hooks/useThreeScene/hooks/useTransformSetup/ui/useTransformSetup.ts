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
  const releaseFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!transformControls) return;

    function onDraggingChanged(event: { value: boolean }) {
      if (event.value) {
        if (releaseFrameRef.current !== null) {
          cancelAnimationFrame(releaseFrameRef.current);
          releaseFrameRef.current = null;
        }
        isDraggingLocalRef.current = true;
        if (isDraggingRef) isDraggingRef.current = true;
        return;
      }

      // Let the transform listener persist the final matrix before scene-sync
      // is allowed to read state and write it back to the selected mesh.
      releaseFrameRef.current = requestAnimationFrame(() => {
        releaseFrameRef.current = null;
        isDraggingLocalRef.current = false;
        if (isDraggingRef) isDraggingRef.current = false;
      });
    }

    transformControls.addEventListener(
      'dragging-changed' as never,
      onDraggingChanged as never
    );

    return () => {
      if (releaseFrameRef.current !== null) {
        cancelAnimationFrame(releaseFrameRef.current);
        releaseFrameRef.current = null;
      }
      transformControls.removeEventListener(
        'dragging-changed' as never,
        onDraggingChanged as never
      );
    };
  }, [transformControls, isDraggingRef]);

  const getIsDragging = useRef(() => isDraggingLocalRef.current).current;

  return { getIsDragging };
}
