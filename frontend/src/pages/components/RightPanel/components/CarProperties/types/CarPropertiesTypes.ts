import { Car } from '../../../../../../store/types/useEditorStoreTypes';
export { formLabelStyles } from '../../../../../../shared/styles/panelStyles';

export interface CarPropertiesProps {
  car: Car;
  onDelete?: () => void;
}
