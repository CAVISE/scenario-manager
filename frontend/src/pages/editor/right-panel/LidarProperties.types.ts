import { Lidar } from '../../../store/editor-store.types';

export interface ILidarProps {
  lidar: Lidar;
  onDelete: () => void;
}
