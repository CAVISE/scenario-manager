import { OdrMapMeshes } from '@editor/hooks/useOpenDriveUtils/useOdrMap/types/useOdrMapTypes';
import { OpenDriveMapInstance } from '@editor/types/editorTypes';

export interface UseSceneAnimatorProps {
  getOdrMeshes: () => OdrMapMeshes;
  getOpenDriveMap: () => OpenDriveMapInstance | null;
  spotlightEnabled?: () => boolean;
}
