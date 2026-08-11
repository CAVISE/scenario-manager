import { Pedestrian } from '../../../store/editor-store.types';

export interface IPedestrianProps {
  pedestrian: Pedestrian;
  onDelete: () => void;
}
