import { Pedestrian } from '../../../../../../../store/types/useEditorStoreTypes';

export interface IPedestrianProps {
  pedestrian: Pedestrian;
  onDelete: () => void;
}
