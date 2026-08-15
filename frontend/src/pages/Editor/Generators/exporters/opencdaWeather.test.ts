import { describe, expect, it } from 'vitest';
import type { CarlaWeather } from '../../../../store/types/useEditorStoreTypes';
import { WEATHER_BY_PRESET, weatherParamsFromPreset } from './opencdaWeather';

describe('weatherParamsFromPreset', () => {
  it('returns ClearNoon params for undefined preset', () => {
    const result = weatherParamsFromPreset(undefined);
    expect(result).toEqual({
      sun_altitude_angle: 75,
      cloudiness: 0,
      precipitation: 0,
      precipitation_deposits: 0,
      wind_intensity: 0,
      fog_density: 0,
      fog_distance: 0,
      fog_falloff: 0,
      wetness: 0,
    });
  });

  it('returns ClearNoon params for unknown preset', () => {
    const result = weatherParamsFromPreset('UnknownPreset' as CarlaWeather);
    expect(result).toEqual({
      sun_altitude_angle: 75,
      cloudiness: 0,
      precipitation: 0,
      precipitation_deposits: 0,
      wind_intensity: 0,
      fog_density: 0,
      fog_distance: 0,
      fog_falloff: 0,
      wetness: 0,
    });
  });

  it('returns ClearNoon params for empty string preset', () => {
    const result = weatherParamsFromPreset('');
    expect(result).toEqual({
      sun_altitude_angle: 75,
      cloudiness: 0,
      precipitation: 0,
      precipitation_deposits: 0,
      wind_intensity: 0,
      fog_density: 0,
      fog_distance: 0,
      fog_falloff: 0,
      wetness: 0,
    });
  });

  it('returns correct params for ClearNoon', () => {
    const result = weatherParamsFromPreset('ClearNoon');
    expect(result).toEqual({
      sun_altitude_angle: 75,
      cloudiness: 0,
      precipitation: 0,
      precipitation_deposits: 0,
      wind_intensity: 0,
      fog_density: 0,
      fog_distance: 0,
      fog_falloff: 0,
      wetness: 0,
    });
  });

  it('returns correct params for CloudyNoon', () => {
    const result = weatherParamsFromPreset('CloudyNoon');
    expect(result).toEqual({
      sun_altitude_angle: 60,
      cloudiness: 70,
      precipitation: 0,
      precipitation_deposits: 0,
      wind_intensity: 0,
      fog_density: 0,
      fog_distance: 0,
      fog_falloff: 0,
      wetness: 0,
    });
  });

  it('returns correct params for WetNoon', () => {
    const result = weatherParamsFromPreset('WetNoon');
    expect(result).toEqual({
      sun_altitude_angle: 60,
      cloudiness: 80,
      precipitation: 30,
      precipitation_deposits: 0,
      wind_intensity: 0,
      fog_density: 0,
      fog_distance: 0,
      fog_falloff: 0,
      wetness: 40,
    });
  });

  it('returns correct params for WetCloudyNoon', () => {
    const result = weatherParamsFromPreset('WetCloudyNoon');
    expect(result).toEqual({
      sun_altitude_angle: 45,
      cloudiness: 90,
      precipitation: 50,
      precipitation_deposits: 0,
      wind_intensity: 0,
      fog_density: 0,
      fog_distance: 0,
      fog_falloff: 0,
      wetness: 60,
    });
  });

  it('returns correct params for SoftRainNoon', () => {
    const result = weatherParamsFromPreset('SoftRainNoon');
    expect(result).toEqual({
      sun_altitude_angle: 45,
      cloudiness: 90,
      precipitation: 25,
      precipitation_deposits: 0,
      wind_intensity: 0,
      fog_density: 0,
      fog_distance: 0,
      fog_falloff: 0,
      wetness: 50,
    });
  });

  it('returns correct params for MidRainyNoon', () => {
    const result = weatherParamsFromPreset('MidRainyNoon');
    expect(result).toEqual({
      sun_altitude_angle: 30,
      cloudiness: 95,
      precipitation: 60,
      precipitation_deposits: 0,
      wind_intensity: 0,
      fog_density: 0,
      fog_distance: 0,
      fog_falloff: 0,
      wetness: 80,
    });
  });

  it('returns correct params for HardRainNoon', () => {
    const result = weatherParamsFromPreset('HardRainNoon');
    expect(result).toEqual({
      sun_altitude_angle: 20,
      cloudiness: 100,
      precipitation: 90,
      precipitation_deposits: 0,
      wind_intensity: 0,
      fog_density: 0,
      fog_distance: 0,
      fog_falloff: 0,
      wetness: 100,
    });
  });

  it('returns correct params for ClearSunset', () => {
    const result = weatherParamsFromPreset('ClearSunset');
    expect(result).toEqual({
      sun_altitude_angle: 15,
      cloudiness: 10,
      precipitation: 0,
      precipitation_deposits: 0,
      wind_intensity: 0,
      fog_density: 0,
      fog_distance: 0,
      fog_falloff: 0,
      wetness: 0,
    });
  });

  it('returns correct params for CloudySunset', () => {
    const result = weatherParamsFromPreset('CloudySunset');
    expect(result).toEqual({
      sun_altitude_angle: 10,
      cloudiness: 70,
      precipitation: 0,
      precipitation_deposits: 0,
      wind_intensity: 0,
      fog_density: 0,
      fog_distance: 0,
      fog_falloff: 0,
      wetness: 0,
    });
  });

  it('returns correct params for WetSunset', () => {
    const result = weatherParamsFromPreset('WetSunset');
    expect(result).toEqual({
      sun_altitude_angle: 8,
      cloudiness: 85,
      precipitation: 30,
      precipitation_deposits: 0,
      wind_intensity: 0,
      fog_density: 0,
      fog_distance: 0,
      fog_falloff: 0,
      wetness: 50,
    });
  });

  it('returns correct params for WetCloudySunset', () => {
    const result = weatherParamsFromPreset('WetCloudySunset');
    expect(result).toEqual({
      sun_altitude_angle: 5,
      cloudiness: 95,
      precipitation: 45,
      precipitation_deposits: 0,
      wind_intensity: 0,
      fog_density: 0,
      fog_distance: 0,
      fog_falloff: 0,
      wetness: 70,
    });
  });

  it('returns correct params for SoftRainSunset', () => {
    const result = weatherParamsFromPreset('SoftRainSunset');
    expect(result).toEqual({
      sun_altitude_angle: 5,
      cloudiness: 90,
      precipitation: 35,
      precipitation_deposits: 0,
      wind_intensity: 0,
      fog_density: 0,
      fog_distance: 0,
      fog_falloff: 0,
      wetness: 60,
    });
  });

  it('returns correct params for MidRainSunset', () => {
    const result = weatherParamsFromPreset('MidRainSunset');
    expect(result).toEqual({
      sun_altitude_angle: 0,
      cloudiness: 100,
      precipitation: 65,
      precipitation_deposits: 0,
      wind_intensity: 0,
      fog_density: 0,
      fog_distance: 0,
      fog_falloff: 0,
      wetness: 85,
    });
  });

  it('returns correct params for HardRainSunset', () => {
    const result = weatherParamsFromPreset('HardRainSunset');
    expect(result).toEqual({
      sun_altitude_angle: -5,
      cloudiness: 100,
      precipitation: 95,
      precipitation_deposits: 0,
      wind_intensity: 0,
      fog_density: 0,
      fog_distance: 0,
      fog_falloff: 0,
      wetness: 100,
    });
  });

  it('returns a new object each time', () => {
    const result1 = weatherParamsFromPreset('ClearNoon');
    const result2 = weatherParamsFromPreset('ClearNoon');
    expect(result1).toEqual(result2);
  });

  it('covers line: returns ClearNoon when preset is not in WEATHER_BY_PRESET', () => {
    const result = weatherParamsFromPreset('NonExistentPreset' as CarlaWeather);
    expect(result).toBe(WEATHER_BY_PRESET.ClearNoon);
  });

  it('covers line: returns ClearNoon when preset is undefined', () => {
    const result = weatherParamsFromPreset(undefined);
    expect(result).toBe(WEATHER_BY_PRESET.ClearNoon);
  });

  it('covers line: returns ClearNoon when preset is null', () => {
    const result = weatherParamsFromPreset(null as unknown as CarlaWeather);
    expect(result).toBe(WEATHER_BY_PRESET.ClearNoon);
  });
});
