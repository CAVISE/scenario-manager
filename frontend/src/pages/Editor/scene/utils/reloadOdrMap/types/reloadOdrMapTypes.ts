import { PARAMS } from '@editor/hooks/useThreeScene/types/useThreeSceneTypes';
import { OpenDriveModule } from '@editor/hooks/useOpenDriveUtils/useOdrMap/types/useOdrMapTypes';
import {
  LOADING_STEPS,
  OdrMapConfig,
  OpenDriveMapInstance,
} from '@editor/types/editorTypes';

export interface OpenDriveMapConfig {
  withLateralProfile: boolean;
  withLaneHeight: boolean;
  withRoadObjects: boolean;
  centerMap: boolean;
  absZForLocalRoadObjOutline: boolean;
}

export interface OpenDriveContext {
  module: OpenDriveModule | null;
  map: OpenDriveMapInstance | null;
  loadMap: (clearMap: boolean) => void;
  setStep: (step: keyof typeof LOADING_STEPS) => void;
  setError: (error: Error) => void;
}

export const DEFAULT_MAP_CONFIG: OdrMapConfig = {
  with_lateralProfile: PARAMS.lateralProfile,
  with_laneHeight: PARAMS.laneHeight,
  with_road_objects: false,
  center_map: false,
  abs_z_for_for_local_road_obj_outline: true,
};

export const LOAD_MAP_CONFIG: OdrMapConfig = {
  with_lateralProfile: PARAMS.lateralProfile,
  with_laneHeight: PARAMS.laneHeight,
  with_road_objects: false,
  center_map: false,
  abs_z_for_for_local_road_obj_outline: false,
};
