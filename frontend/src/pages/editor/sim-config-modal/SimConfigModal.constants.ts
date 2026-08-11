import type { Theme } from '@mui/material/styles';

export const CARLA_MAPS = [
  'Town01',
  'Town02',
  'Town03',
  'Town04',
  'Town05',
  'Town06',
  'Town07',
  'Town10HD',
  'TownBig',
];

export const WEATHER_PRESETS = [
  'ClearNoon',
  'CloudyNoon',
  'WetNoon',
  'HardRainNoon',
  'ClearSunset',
  'CloudySunset',
  'WetSunset',
  'HardRainSunset',
  'ClearNight',
  'CloudyNight',
  'WetNight',
  'HardRainNight',
  'SoftRainNight',
] as const;

export const modalBoxSx = {
  position: 'absolute' as const,
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 'min(94vw, 720px)',
  bgcolor: 'background.paper',
  borderRadius: 2,
  border: '1px solid',
  borderColor: 'divider',
  boxShadow: 24,
  p: 3,
  maxHeight: '90vh',
  overflowY: 'auto',
} as const;

export const openCdaAccordionSx = {
  bgcolor: 'transparent',
  '&:before': { display: 'none' },
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 1.5,
  overflow: 'hidden',
  transition: (theme: Theme) =>
    theme.transitions.create(['border-color', 'box-shadow']),
  '&.Mui-expanded': {
    borderColor: 'primary.main',
    boxShadow: (theme: { palette: { mode: string } }) =>
      theme.palette.mode === 'dark'
        ? '0 4px 20px rgba(0, 0, 0, 0.35)'
        : '0 4px 16px rgba(15, 23, 42, 0.08)',
  },
} as const;
