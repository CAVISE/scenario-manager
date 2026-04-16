import { Car } from "../../../../../../../store/types/useEditorStoreTypes";

export interface CarPropertiesProps {
  car: Car;
  onDelete: () => void;
  onDetach: () => void;
}
