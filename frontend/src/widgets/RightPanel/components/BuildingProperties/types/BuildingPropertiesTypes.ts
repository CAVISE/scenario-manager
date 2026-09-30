import type { Building } from '@/entities/building';

export interface BuildingPropertiesProps {
  building: Building;
  onDelete: () => void;
}
