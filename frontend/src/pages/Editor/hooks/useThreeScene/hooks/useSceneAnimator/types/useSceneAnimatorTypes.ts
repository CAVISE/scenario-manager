import { OpenDriveMapInstance } from '../../../../../types/editorTypes';
import { OdrMapMeshes } from '../../../../useOpenDriveUtils/useOdrMap/types/useOdrMapTypes';

export interface UseSceneAnimatorProps {
  getIsDragging: () => boolean;
  getOdrMeshes: () => OdrMapMeshes;
  getOpenDriveMap: () => OpenDriveMapInstance | null;
  spotlightEnabled?: () => boolean;
}
