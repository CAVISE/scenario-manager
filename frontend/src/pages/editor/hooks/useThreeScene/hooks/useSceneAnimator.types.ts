import { OpenDriveMapInstance } from '../../../editor.types';
import { OdrMapMeshes } from '../../useOdrMap.types';

export interface UseSceneAnimatorProps {
  getIsDragging: () => boolean;
  getOdrMeshes: () => OdrMapMeshes;
  getOpenDriveMap: () => OpenDriveMapInstance | null;
  spotlightEnabled?: () => boolean;
}
