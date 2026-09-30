import type { Lidar } from '@/entities/vehicle';

export const createLidarUserData = (lidar: Lidar) => ({
  type: 'lidar' as const,
  id: lidar.id,
  carId: lidar.carId,
});
