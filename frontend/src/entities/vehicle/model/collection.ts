import { removeById, updateById } from '@/shared/utils/entityCollection';
import type { Car, Lidar, Point } from './types';

export type VehicleSceneState = {
  cars: Car[];
  points: Point[];
  lidars: Lidar[];
  selectedIds: string[];
};

export function removeVehicle(
  state: VehicleSceneState,
  vehicleId: string
): VehicleSceneState {
  return {
    cars: state.cars.filter((car) => car.id !== vehicleId),
    points: state.points.filter((point) => point.carId !== vehicleId),
    lidars: state.lidars.filter((lidar) => lidar.carId !== vehicleId),
    selectedIds: state.selectedIds.filter((id) => id !== vehicleId),
  };
}

export function updateCar(cars: Car[], id: string, patch: Partial<Car>): Car[] {
  return updateById(cars, id, patch);
}

export function updateLidar(
  lidars: Lidar[],
  id: string,
  patch: Partial<Lidar>
): Lidar[] {
  return updateById(lidars, id, patch);
}

export function removeLidar(lidars: Lidar[], id: string): Lidar[] {
  return removeById(lidars, id);
}

export function removeLidarsByVehicleId(
  lidars: Lidar[],
  vehicleId: string
): Lidar[] {
  return lidars.filter((lidar) => lidar.carId !== vehicleId);
}

export function updatePoint(
  points: Point[],
  id: string,
  patch: Partial<Point>
): Point[] {
  return updateById(points, id, patch);
}

export function removePoint(points: Point[], id: string): Point[] {
  return removeById(points, id);
}

export function removePointsByVehicleId(
  points: Point[],
  vehicleId: string
): Point[] {
  return points.filter((point) => point.carId !== vehicleId);
}
