import { MoveKind } from '../types/createTransformListenerTypes';

export const MOVE_LABEL: Record<MoveKind, string> = {
  car: 'Moved car',
  rsu: 'Moved RSU',
  lidar: 'Moved lidar',
  building: 'Moved building',
  pedestrian: 'Moved pedestrian',
  point: 'Moved waypoint',
};
