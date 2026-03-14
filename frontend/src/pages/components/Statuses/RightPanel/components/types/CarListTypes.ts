import { Lidar } from "../../../../../../store/types/useEditorStoreTypes";

export interface CarListProps {
  carId: string;
  lidars: Lidar[];
  onDetach: () => void;
}