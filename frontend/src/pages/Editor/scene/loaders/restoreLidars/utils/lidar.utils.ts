import { Lidar } from '@/store/types/useEditorStoreTypes';

export const createLidarUserData = (lidar: Lidar) => ({
  type: 'lidar' as const,
  id: lidar.id,
  carId: lidar.carId,
});
