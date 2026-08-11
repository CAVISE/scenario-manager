import { SimulationConfig } from '../../../../../../Generators/types/configGeneratorsTypes';
import { CARLA_MAPS } from '../../../../types/SimConfigModalTypes';
export type CarlaConfig = SimulationConfig['carla'];
export function toCarlaMapNameFromXodr(xodrName: string): string | null {
  const base = xodrName.replace(/\.xodr$/i, '');
  if (!base) return null;
  if (
    base.toLowerCase() === 'town10' ||
    base.toLowerCase() === 'town10hd_opt'
  ) {
    return 'Town10HD';
  }
  const withoutOpt = base.replace(/_Opt$/i, '');
  return CARLA_MAPS.includes(withoutOpt) ? withoutOpt : null;
}
export const SENSORS = ['camera', 'lidar', 'radar', 'gnss', 'imu'] as const;
export const WEATHER_KEYS = [
  'sun_altitude_angle',
  'cloudiness',
  'precipitation',
  'precipitation_deposits',
  'wind_intensity',
  'fog_density',
  'fog_distance',
  'fog_falloff',
  'wetness',
] as const;

export type WeatherKey = (typeof WEATHER_KEYS)[number];
