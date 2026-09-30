import type { Lidar } from '@/entities/vehicle';

export interface CarListProps {
  carId: string;
  lidars: Lidar[];
}
