import { MutableRefObject } from 'react';
import { TransformControls } from 'three-stdlib';

export interface UseTransformSetupProps {
  transformControls: TransformControls | undefined;
  isDraggingRef: MutableRefObject<boolean>;
}

export interface UseTransformSetupResult {
  getIsDragging: () => boolean;
}
