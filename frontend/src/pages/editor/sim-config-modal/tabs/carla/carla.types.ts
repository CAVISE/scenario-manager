import type { SimulationConfig } from '../../../generators/generators.types';
import type { CARLA_WEATHER_KEYS } from './carla.constants';

export type CarlaConfig = SimulationConfig['carla'];
export type CarlaWeatherKey = (typeof CARLA_WEATHER_KEYS)[number];

export interface CarlaSectionProps {
  carla: CarlaConfig;
  update: (patch: Partial<CarlaConfig>) => void;
}

export interface CarlaMapWeatherSectionProps extends CarlaSectionProps {
  selectedMap: string;
}

export interface CarlaWeatherOverrideSectionProps extends CarlaSectionProps {
  customWeatherEnabled: boolean;
}
