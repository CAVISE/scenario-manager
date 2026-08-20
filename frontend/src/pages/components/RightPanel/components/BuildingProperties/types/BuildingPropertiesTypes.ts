import { Building } from '@/store/types/useEditorStoreTypes';
export {
  formLabelStyles,
  typographyStyles,
  toggleButtonStyles,
  toggleButtonGroupStyles,
} from '@/shared/styles/panelStyles';

export interface BuildingPropertiesProps {
  building: Building;
  onDelete: () => void;
}
