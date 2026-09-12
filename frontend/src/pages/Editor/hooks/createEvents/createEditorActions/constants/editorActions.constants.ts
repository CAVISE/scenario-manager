export const FILE_ACCEPT = '.xodr';

export const MODE_NAMES = {
  CAR: 'car',
  POINT: 'point',
  RSU: 'rsu',
  PEDESTRIAN: 'pedestrian',
  DIRECTION_POINTS: 'directionPoints',
} as const;

export type ModeName = keyof typeof MODE_NAMES;
