import { Building } from '../../../../../../../store/useEditorStore';

export interface BuildingPropertiesProps {
  building: Building;
  onDelete: () => void;
}
export const formLabelStyles = { fontSize: 'xs', mb: 0.5 } as const;
export const typographyStyles = { color: 'text.secondary' } as const;
export const toggleButtonStyles = {
  flex: '1 1 40%',
  textTransform: 'capitalize',
} as const;
export const toggleButtonGroupStyles = { flexWrap: 'wrap' } as const;
