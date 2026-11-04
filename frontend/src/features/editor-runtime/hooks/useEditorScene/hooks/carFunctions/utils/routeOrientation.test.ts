import { describe, expect, it } from 'vitest';
import type { Car, Point } from '@/entities/vehicle';
import {
  getCarsNeedingRouteAlignment,
  getRouteOrientation,
} from './routeOrientation';

const car: Car = {
  id: 'car-1',
  x: 5,
  y: 5,
  z: 0,
  rotation: 0,
  scale: 1,
  speed: 60,
  color: '#000000',
  model: 'vehicle_1',
};
const point: Point = { id: 'point-1', carId: 'car-1', x: 5, y: 15, z: 0 };

describe('route orientation', () => {
  it('aligns the model front with the direction to its first waypoint', () => {
    expect(getRouteOrientation(car, [point])).toBeCloseTo(Math.PI);
  });

  it('does not update cars without a route or an already matching heading', () => {
    expect(getCarsNeedingRouteAlignment([car], [])).toEqual([]);
    expect(
      getCarsNeedingRouteAlignment([{ ...car, rotation: Math.PI }], [point])
    ).toEqual([]);
  });
});
