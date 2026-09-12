import { CarlaWeather } from '@/store/types/useEditorStoreTypes';

export interface WeatherSelectorProps {
  value: CarlaWeather;
  onChange: (value: CarlaWeather) => void;
}
