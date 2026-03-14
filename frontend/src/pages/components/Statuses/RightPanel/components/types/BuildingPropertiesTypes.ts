import { Building } from "../../../../../../store/types/useEditorStoreTypes";

export interface BuildingPropertiesProps {
  building: Building;
  onDelete: () => void;
}