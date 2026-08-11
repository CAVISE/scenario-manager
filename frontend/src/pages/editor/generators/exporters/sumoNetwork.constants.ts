export const MAX_PRECISE_SNAP_DISTANCE = 10;
export const MAX_DIRECTIONAL_SNAP_DISTANCE_DELTA = 2;
export const MIN_LANE_POSITION_MARGIN = 0.1;

export const NON_DRIVING_LANE_TYPES = new Set([
  'biking',
  'border',
  'bus_stop',
  'parking',
  'shoulder',
  'sidewalk',
  'walking',
]);

export const DEPART_LANE_KEYWORDS = new Set([
  'allowed',
  'best',
  'best_prob',
  'first',
  'free',
  'random',
]);
