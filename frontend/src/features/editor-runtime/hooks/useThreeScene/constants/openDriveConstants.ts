export const CACHE_KEY = 'cached_xodr';
export const MAP_PATH = './data.xodr';
export const DEFAULT_COLOR = '00ff00';

export const ODR_MAP_OPTIONS = {
  with_lateralProfile: true,
  with_laneHeight: true,
  with_road_objects: false,
  center_map: true,
  abs_z_for_for_local_road_obj_outline: true,
} as const;
