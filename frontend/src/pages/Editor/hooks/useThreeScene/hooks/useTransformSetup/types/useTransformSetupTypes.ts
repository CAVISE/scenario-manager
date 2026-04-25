import { TransformControls } from 'three-stdlib';

export interface UseTransformSetupProps {
  transformControls: TransformControls | undefined;
  isDraggingRef?: React.RefObject<boolean>;
}

export interface UseTransformSetupResult {
  getIsDragging: () => boolean;
}
