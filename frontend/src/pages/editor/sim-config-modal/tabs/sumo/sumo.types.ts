import type { Car } from '../../../../../store/editor-store.types';
import type { SimulationConfig } from '../../../generators/generators.types';

export type SumoConfig = SimulationConfig['sumo'];

export interface SumoSectionProps {
  sumo: SumoConfig;
  onUpdate: (patch: Partial<SumoConfig>) => void;
}

export interface SumoFilesSectionProps extends SumoSectionProps {
  carlaMap: string;
  loadedNetFilename: string;
  onLoadNetwork: (file: File) => void;
  onNetFileChange: (name: string) => void;
}

export interface VehicleRoutesSectionProps {
  cars: Car[];
  vtypes: SumoConfig['vtypes'];
  onUpdateCar: (id: string, patch: Partial<Car>) => void;
}
