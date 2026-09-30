import type { SimulationConfig } from '@/store';
import type { CARLA_WEATHER_KEYS } from '../constants/carlaConstants';

export type CarlaConfig = SimulationConfig['carla'];
export type WeatherKey = (typeof CARLA_WEATHER_KEYS)[number];

export interface CarlaSectionProps {
  carla: CarlaConfig;
  update: (patch: Partial<CarlaConfig>) => void;
}

export interface MapWeatherSectionProps extends CarlaSectionProps {
  selectedMap: string;
}

export interface WeatherOverrideSectionProps extends CarlaSectionProps {
  customWeatherEnabled: boolean;
}
