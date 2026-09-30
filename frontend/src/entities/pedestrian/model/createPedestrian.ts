import type { CreatePedestrianParams, Pedestrian } from './types';

export function createPedestrian(params: CreatePedestrianParams): Pedestrian {
  return {
    ...params,
    speed: 1.2,
    cross_factor: 0.5,
    is_invincible: false,
    tx_power: 10,
    frequency: 5.9e9,
    protocol: 'DSRC',
    beacon_interval: 1000,
  };
}
