import type { Lidar } from '@/entities/vehicle';

export interface ILidarProps {
  lidar: Lidar;
  onDelete: () => void;
}
