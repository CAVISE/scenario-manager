import { Car, Lidar } from '@/store/types/useEditorStoreTypes';
export { formLabelStyles } from '@/shared/styles/panelStyles';

export interface CarPropertiesProps {
  car: Car;
  carLidars?: Lidar[];
  onDelete?: () => void;
}
