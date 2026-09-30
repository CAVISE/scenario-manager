import { describe, expect, it } from 'vitest';
import { createCar } from './createCar';
import { createLidar } from './createLidar';
import { createPoint } from './createPoint';
import { removeVehicle } from './collection';

describe('createCar', () => {
  it('applies editor defaults without changing explicit vehicle data', () => {
    expect(
      createCar({
        id: 'car-1',
        x: 10,
        y: 20,
        z: 30,
        model: 'vehicle.tesla.model3',
        color: 'ffffff',
      })
    ).toEqual({
      id: 'car-1',
      x: 10,
      y: 20,
      z: 30,
      model: 'vehicle.tesla.model3',
      color: 'ffffff',
      speed: 50,
      scale: 1,
      rotation: 0,
    });
  });

  it('preserves an explicitly selected speed', () => {
    expect(
      createCar({
        id: 'car-2',
        x: 0,
        y: 0,
        z: 0,
        model: 'vehicle.audi.a2',
        color: '000000',
        speed: 75,
      }).speed
    ).toBe(75);
  });

  it('creates lidar with the editor sensor defaults', () => {
    expect(
      createLidar({ id: 'lidar-1', carId: 'car-1', x: 1, y: 2, z: 3 })
    ).toMatchObject({
      rotation: 0,
      range: 50,
      channels: 32,
      rotation_frequency: 10,
    });
  });

  it('keeps route points as a lossless vehicle-owned value object', () => {
    expect(
      createPoint({ id: 'point-1', carId: 'car-1', x: 1, y: 2, z: 3 })
    ).toEqual({
      id: 'point-1',
      carId: 'car-1',
      x: 1,
      y: 2,
      z: 3,
    });
  });

  it('removes a vehicle together with its dependent scene objects', () => {
    expect(
      removeVehicle(
        {
          cars: [
            createCar({
              id: 'car-1',
              x: 0,
              y: 0,
              z: 0,
              model: 'vehicle.audi.a2',
              color: '000000',
            }),
            createCar({
              id: 'car-2',
              x: 0,
              y: 0,
              z: 0,
              model: 'vehicle.audi.a2',
              color: 'ffffff',
            }),
          ],
          points: [
            createPoint({ id: 'point-1', carId: 'car-1', x: 0, y: 0, z: 0 }),
          ],
          lidars: [
            createLidar({ id: 'lidar-1', carId: 'car-1', x: 0, y: 0, z: 0 }),
          ],
          selectedIds: ['car-1', 'car-2'],
        },
        'car-1'
      )
    ).toMatchObject({
      cars: [expect.objectContaining({ id: 'car-2' })],
      points: [],
      lidars: [],
      selectedIds: ['car-2'],
    });
  });
});
