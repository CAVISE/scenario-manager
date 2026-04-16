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
export const modalBoxSx = {
  position: 'absolute' as const,
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 580,
  bgcolor: 'background.paper',
  borderRadius: 2,
  boxShadow: 24,
  p: 4,
  maxHeight: '90vh',
  overflowY: 'auto',
} as const;