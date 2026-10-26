import type { Car, Point } from '@/entities/vehicle';

const MIN_DIRECTION_DISTANCE = 0.001;
// Car.obj faces local -Y after the loader's X-axis correction.
const CAR_FORWARD_ROTATION_OFFSET = Math.PI / 2;

export function getRouteOrientation(car: Car, points: Point[]): number | null {
  const firstWaypoint = points.find((point) => point.carId === car.id);
  if (!firstWaypoint) return null;

  const dx = firstWaypoint.x - car.x;
  const dy = firstWaypoint.y - car.y;
  if (Math.hypot(dx, dy) < MIN_DIRECTION_DISTANCE) return null;

  return normalizeAngle(Math.atan2(dy, dx) + CAR_FORWARD_ROTATION_OFFSET);
}

export function getCarsNeedingRouteAlignment(cars: Car[], points: Point[]) {
  return cars.flatMap((car) => {
    const rotation = getRouteOrientation(car, points);
    return rotation === null || hasSameAngle(car.rotation, rotation)
      ? []
      : [{ id: car.id, rotation }];
  });
}

function hasSameAngle(first: number, second: number) {
  return Math.abs(normalizeAngle(first - second)) < 0.0001;
}

function normalizeAngle(angle: number) {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}
