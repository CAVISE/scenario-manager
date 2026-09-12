import { CarlaWeather } from '@/store/types/useEditorStoreTypes';

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
