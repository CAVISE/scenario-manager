import { LOADING_STEPS } from '../../../../../types/editorTypes';

export interface UseOdrLoaderProps {
  setStep: (step: keyof typeof LOADING_STEPS) => void;
  setError: ((err: Error) => void) | undefined;
  loadOdrMapRef: React.RefObject<
    (clearMap?: boolean, fitView?: boolean) => void
  >;
}

export const CACHE_KEY = 'cached_xodr';
export const MAP_PATH = './data.xodr';

export const ODR_MAP_OPTIONS = {
  with_lateralProfile: true,
  with_laneHeight: true,
  with_road_objects: false,
  center_map: true,
  abs_z_for_for_local_road_obj_outline: true,
} as const;
