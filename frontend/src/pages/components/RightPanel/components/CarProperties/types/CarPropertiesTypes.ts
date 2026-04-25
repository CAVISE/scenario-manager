import { Car } from '../../../../../../store/types/useEditorStoreTypes';

export interface CarPropertiesProps {
  car: Car;
  onDelete: () => void;
}
export const formLabelStyles = { fontSize: 'xs', mb: 0.5 } as const;
