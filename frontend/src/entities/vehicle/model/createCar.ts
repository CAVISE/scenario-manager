import type { Car, CreateCarParams } from './types';

export function createCar({ speed = 50, ...params }: CreateCarParams): Car {
  return {
    ...params,
    speed,
    scale: 1,
    rotation: 0,
  };
}
