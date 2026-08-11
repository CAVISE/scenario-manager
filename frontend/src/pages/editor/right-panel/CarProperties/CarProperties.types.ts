import { Car } from '../../../../store/editor-store.types';
export { formLabelStyles } from '../../../../shared/styles/panelStyles';

export interface CarPropertiesProps {
  car: Car;
  onDelete?: () => void;
}
