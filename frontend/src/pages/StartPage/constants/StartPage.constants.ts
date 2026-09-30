import type { CarlaWeather } from '@/entities/scenario';

export const ROUTES = {
  EDITOR: '/editor',
  HOME: '/',
} as const;

export const DEFAULT_SCENARIO = {
  id: '',
  name: 'New Scenario',
  weather: 'ClearNoon' as CarlaWeather,
  description: '',
  file_: null,
} as const;

export const WEATHER_OPTIONS = [
  'ClearNoon',
  'CloudyNoon',
  'WetNoon',
  'WetCloudyNoon',
  'SoftRainNoon',
  'MidRainyNoon',
  'HardRainNoon',
  'ClearSunset',
  'CloudySunset',
  'WetSunset',
  'WetCloudySunset',
  'SoftRainSunset',
  'MidRainSunset',
  'HardRainSunset',
] as const;
