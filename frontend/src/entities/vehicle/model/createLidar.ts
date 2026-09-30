import type { CreateLidarParams, Lidar } from './types';

export function createLidar(params: CreateLidarParams): Lidar {
  return {
    ...params,
    rotation: 0,
    range: 50,
    channels: 32,
    rotation_frequency: 10,
  };
}
