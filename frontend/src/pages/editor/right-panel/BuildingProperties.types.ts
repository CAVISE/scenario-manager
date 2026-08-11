import { Building } from '../../../store/editor-store.types';
export {
  formLabelStyles,
  typographyStyles,
  toggleButtonStyles,
  toggleButtonGroupStyles,
} from '../../../shared/styles/panelStyles';

export interface BuildingPropertiesProps {
  building: Building;
  onDelete: () => void;
}
