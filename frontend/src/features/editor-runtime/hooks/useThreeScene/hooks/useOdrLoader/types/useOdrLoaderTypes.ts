import { OpenDriveModule } from '@editor/hooks/useOpenDriveUtils/useOdrMap/types/useOdrMapTypes';
import type { OpenDriveMapInstance } from '@editor/types/editorTypes';
import { LOADING_STEPS } from '@editor/constants/editorConstants';
import type { MutableRefObject } from 'react';

export interface UseOdrLoaderProps {
  setStep: (step: keyof typeof LOADING_STEPS) => void;
  setError: ((err: Error) => void) | undefined;
  moduleRef: MutableRefObject<OpenDriveModule | null>;
  mapRef: MutableRefObject<OpenDriveMapInstance | null>;
  loadOdrMapRef: MutableRefObject<
    (clearMap?: boolean, fitView?: boolean) => void
  >;
}
