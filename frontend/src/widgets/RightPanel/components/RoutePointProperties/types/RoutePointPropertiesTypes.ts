import type { Point } from '@/entities/vehicle';

export interface RoutePointPropertiesProps {
  point: Point;
  onDelete: () => void;
}
