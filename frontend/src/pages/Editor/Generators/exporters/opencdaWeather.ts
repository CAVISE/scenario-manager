import type { CarlaWeather } from '../../../../store/types/useEditorStoreTypes';

export type OpenCDAWeatherParams = {
  sun_altitude_angle: number;
  cloudiness: number;
  precipitation: number;
  precipitation_deposits: number;
  wind_intensity: number;
  fog_density: number;
  fog_distance: number;
  fog_falloff: number;
  wetness: number;
};

const CLEAR_NOON: OpenCDAWeatherParams = {
  sun_altitude_angle: 75,
  cloudiness: 0,
  precipitation: 0,
  precipitation_deposits: 0,
  wind_intensity: 0,
  fog_density: 0,
  fog_distance: 0,
  fog_falloff: 0,
  wetness: 0,
};

export const WEATHER_BY_PRESET: Record<CarlaWeather, OpenCDAWeatherParams> = {
  ClearNoon: CLEAR_NOON,
  CloudyNoon: { ...CLEAR_NOON, sun_altitude_angle: 60, cloudiness: 70 },
  WetNoon: {
    ...CLEAR_NOON,
    sun_altitude_angle: 60,
    cloudiness: 80,
    precipitation: 30,
    wetness: 40,
  },
  WetCloudyNoon: {
    ...CLEAR_NOON,
    sun_altitude_angle: 45,
    cloudiness: 90,
    precipitation: 50,
    wetness: 60,
  },
  SoftRainNoon: {
    ...CLEAR_NOON,
    sun_altitude_angle: 45,
    cloudiness: 90,
    precipitation: 25,
    wetness: 50,
  },
  MidRainyNoon: {
    ...CLEAR_NOON,
    sun_altitude_angle: 30,
    cloudiness: 95,
    precipitation: 60,
    wetness: 80,
  },
  HardRainNoon: {
    ...CLEAR_NOON,
    sun_altitude_angle: 20,
    cloudiness: 100,
    precipitation: 90,
    wetness: 100,
  },
  ClearSunset: { ...CLEAR_NOON, sun_altitude_angle: 15, cloudiness: 10 },
  CloudySunset: { ...CLEAR_NOON, sun_altitude_angle: 10, cloudiness: 70 },
  WetSunset: {
    ...CLEAR_NOON,
    sun_altitude_angle: 8,
    cloudiness: 85,
    precipitation: 30,
    wetness: 50,
  },
  WetCloudySunset: {
    ...CLEAR_NOON,
    sun_altitude_angle: 5,
    cloudiness: 95,
    precipitation: 45,
    wetness: 70,
  },
  SoftRainSunset: {
    ...CLEAR_NOON,
    sun_altitude_angle: 5,
    cloudiness: 90,
    precipitation: 35,
    wetness: 60,
  },
  MidRainSunset: {
    ...CLEAR_NOON,
    sun_altitude_angle: 0,
    cloudiness: 100,
    precipitation: 65,
    wetness: 85,
  },
  HardRainSunset: {
    ...CLEAR_NOON,
    sun_altitude_angle: -5,
    cloudiness: 100,
    precipitation: 95,
    wetness: 100,
  },
};

export function weatherParamsFromPreset(
  preset: CarlaWeather | string | undefined,
): OpenCDAWeatherParams {
  if (preset && preset in WEATHER_BY_PRESET) {
    return WEATHER_BY_PRESET[preset as CarlaWeather];
  }
  return WEATHER_BY_PRESET.ClearNoon;
}
