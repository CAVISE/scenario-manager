import { TransformControls } from 'three-stdlib';

export interface UseTransformSetupProps {
  transformControls: TransformControls | undefined;
  isDraggingRef?: React.MutableRefObject<boolean>;
}

export interface UseTransformSetupResult {
  getIsDragging: () => boolean;
}
