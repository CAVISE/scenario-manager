export type CarlaWeather =
  | 'CloudyNoon'
  | 'ClearNoon'
  | 'WetNoon'
  | 'WetCloudyNoon'
  | 'SoftRainNoon'
  | 'MidRainyNoon'
  | 'HardRainNoon'
  | 'ClearSunset'
  | 'CloudySunset'
  | 'WetSunset'
  | 'WetCloudySunset'
  | 'SoftRainSunset'
  | 'MidRainSunset'
  | 'HardRainSunset';

export type Scenario = {
  id: string;
  revision?: number;
  name: string;
  weather: string;
  description: string;
  file_: string | null;
};
