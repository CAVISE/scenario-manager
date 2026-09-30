import type { Pedestrian } from '@/entities/pedestrian';

export interface IPedestrianProps {
  pedestrian: Pedestrian;
  onDelete: () => void;
}
