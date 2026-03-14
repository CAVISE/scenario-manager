export interface SimConfigModalProps {
  open: boolean;
  onClose: () => void;
}

export const CARLA_MAPS = ['Town01', 'Town02', 'Town03', 'Town04', 'Town05', 'Town06', 'Town07', 'Town10HD'];
export const WEATHER_PRESETS = [
  'ClearNoon', 'CloudyNoon', 'WetNoon', 'HardRainNoon',
  'ClearSunset', 'CloudySunset', 'WetSunset', 'HardRainSunset',
  'ClearNight', 'CloudyNight', 'WetNight', 'HardRainNight', 'SoftRainNight',
] as const;