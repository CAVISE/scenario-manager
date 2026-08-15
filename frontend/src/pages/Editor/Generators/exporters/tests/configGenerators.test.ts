import { describe, it, expect } from 'vitest';
import {
  isValidAttackType,
  normalizeAttackType,
  normalizeAttackStages,
  OpenCDAAttackStage,
  mergeSimConfigWithDefaults,
  defaultSimConfig,
} from '../../types/configGeneratorsTypes';

describe('isValidAttackType', () => {
  it('returns true for each of the four known attack types', () => {
    expect(isValidAttackType('sniffer')).toBe(true);
    expect(isValidAttackType('dropper')).toBe(true);
    expect(isValidAttackType('replayer')).toBe(true);
    expect(isValidAttackType('spoofer')).toBe(true);
  });

  it('returns false for an unknown or empty string', () => {
    expect(isValidAttackType('jammer')).toBe(false);
    expect(isValidAttackType('')).toBe(false);
  });

  it('is case-sensitive: an uppercase known type is not itself valid', () => {
    expect(isValidAttackType('Sniffer')).toBe(false);
  });
});

describe('normalizeAttackType', () => {
  it('lowercases and returns a known type given in any case', () => {
    expect(normalizeAttackType('Sniffer')).toBe('sniffer');
    expect(normalizeAttackType('DROPPER')).toBe('dropper');
    expect(normalizeAttackType('replayer')).toBe('replayer');
  });

  it('passes an unknown type through unchanged (not lowercased)', () => {
    expect(normalizeAttackType('CustomJammer')).toBe('CustomJammer');
  });
});

describe('normalizeAttackStages', () => {
  it('returns an empty array for non-array input', () => {
    expect(normalizeAttackStages(undefined)).toEqual([]);
    expect(normalizeAttackStages(null)).toEqual([]);
    expect(normalizeAttackStages('not an array')).toEqual([]);
    expect(normalizeAttackStages({})).toEqual([]);
  });

  it('returns an empty array for an empty array', () => {
    expect(normalizeAttackStages([])).toEqual([]);
  });

  it('normalizes the type of a flat array of stage objects', () => {
    const stages: OpenCDAAttackStage[] = [
      { id: 's1', type: 'Sniffer' as never },
      { id: 's2', type: 'DROPPER' as never },
    ];

    const result = normalizeAttackStages(stages);

    expect(result).toEqual([
      { id: 's1', type: 'sniffer' },
      { id: 's2', type: 'dropper' },
    ]);
  });

  it('flattens one level of nested arrays and normalizes each inner stage', () => {
    const stages = [
      [
        { id: 's1', type: 'Sniffer' },
        { id: 's2', type: 'Replayer' },
      ],
      { id: 's3', type: 'Spoofer' },
    ];

    const result = normalizeAttackStages(stages);

    expect(result).toEqual([
      { id: 's1', type: 'sniffer' },
      { id: 's2', type: 'replayer' },
      { id: 's3', type: 'spoofer' },
    ]);
  });

  it('skips non-object entries inside a nested array without throwing', () => {
    const stages = [['not an object', 42, null, { id: 's1', type: 'Sniffer' }]];

    const result = normalizeAttackStages(stages);

    expect(result).toEqual([{ id: 's1', type: 'sniffer' }]);
  });

  it('skips a top-level non-object, non-array entry without throwing', () => {
    const stages = ['not an object', { id: 's1', type: 'Sniffer' }];

    const result = normalizeAttackStages(stages);

    expect(result).toEqual([{ id: 's1', type: 'sniffer' }]);
  });

  it('does not add a type field to a stage that has none', () => {
    const stages = [{ id: 's1' }];

    const result = normalizeAttackStages(stages);

    expect(result).toEqual([{ id: 's1' }]);
  });

  it('rejects a nested array-of-arrays entry (arrays inside arrays are not stage objects)', () => {
    const stages = [[['too', 'deep']]];

    const result = normalizeAttackStages(stages);

    expect(result).toEqual([]);
  });

  it('preserves every other field on a stage besides type', () => {
    const stages = [
      {
        id: 's1',
        type: 'Sniffer',
        capabilities: ['intercept'],
        params: { rate: 10 },
      },
    ];

    const result = normalizeAttackStages(stages);

    expect(result).toEqual([
      {
        id: 's1',
        type: 'sniffer',
        capabilities: ['intercept'],
        params: { rate: 10 },
      },
    ]);
  });
});

describe('normalizeCarlaMap (via mergeSimConfigWithDefaults)', () => {
  it('defaults to the current default map when no carla.map is given', () => {
    const merged = mergeSimConfigWithDefaults({});

    expect(merged.carla.map).toBe(defaultSimConfig.carla.map);
  });

  it('defaults when carla.map is not a string', () => {
    const merged = mergeSimConfigWithDefaults({
      carla: { ...defaultSimConfig.carla, map: 123 as never },
    });

    expect(merged.carla.map).toBe(defaultSimConfig.carla.map);
  });

  it('passes through a valid map name unchanged', () => {
    const merged = mergeSimConfigWithDefaults({
      carla: { ...defaultSimConfig.carla, map: 'Town05' },
    });

    expect(merged.carla.map).toBe('Town05');
  });

  it('passes through a valid map name with surrounding whitespace trimmed', () => {
    const merged = mergeSimConfigWithDefaults({
      carla: { ...defaultSimConfig.carla, map: '  Town03  ' },
    });

    expect(merged.carla.map).toBe('Town03');
  });

  it("normalizes the special-case 'town10' (lowercase) to 'Town10HD'", () => {
    const merged = mergeSimConfigWithDefaults({
      carla: { ...defaultSimConfig.carla, map: 'town10' },
    });

    expect(merged.carla.map).toBe('Town10HD');
  });

  it('falls back to the default map for an unrecognized map name', () => {
    const merged = mergeSimConfigWithDefaults({
      carla: { ...defaultSimConfig.carla, map: 'NotARealTown' },
    });

    expect(merged.carla.map).toBe(defaultSimConfig.carla.map);
  });

  it('falls back to the default map for an empty string', () => {
    const merged = mergeSimConfigWithDefaults({
      carla: { ...defaultSimConfig.carla, map: '' },
    });

    expect(merged.carla.map).toBe(defaultSimConfig.carla.map);
  });
});

describe('mergeSimConfigWithDefaults: attacks and legacy bg_spawn_range fields', () => {
  it('normalizes the stages of each given attack, preserving other attack fields', () => {
    const merged = mergeSimConfigWithDefaults({
      attacks: [
        {
          name: 'attack-1',
          stages: [{ id: 's1', type: 'Sniffer' as never }],
        },
      ],
    });

    expect(merged.attacks).toEqual([
      {
        name: 'attack-1',
        stages: [{ id: 's1', type: 'sniffer' }],
      },
    ]);
  });

  it('defaults to an empty attacks array when none is given', () => {
    const merged = mergeSimConfigWithDefaults({});

    expect(merged.attacks).toEqual([]);
  });

  it('prefers the new x_step/y_step fields over the legacy z_min/z_max fields when both are present', () => {
    const merged = mergeSimConfigWithDefaults({
      opencda: {
        ...defaultSimConfig.opencda,
        bg_spawn_range: {
          ...defaultSimConfig.opencda.bg_spawn_range,
          x_step: 5,
          y_step: 6,
          // @ts-expect-error legacy fields kept only for backward-compat migration
          z_min: 99,
          z_max: 98,
        },
      },
    });

    expect(merged.opencda.bg_spawn_range.x_step).toBe(5);
    expect(merged.opencda.bg_spawn_range.y_step).toBe(6);
  });

  it('falls back to the default x_step/y_step when neither the new nor the legacy fields are present', () => {
    const merged = mergeSimConfigWithDefaults({});

    expect(merged.opencda.bg_spawn_range.x_step).toBe(
      defaultSimConfig.opencda.bg_spawn_range.x_step,
    );
    expect(merged.opencda.bg_spawn_range.y_step).toBe(
      defaultSimConfig.opencda.bg_spawn_range.y_step,
    );
  });

  it('treats null/undefined input the same as an empty object', () => {
    expect(mergeSimConfigWithDefaults(null)).toEqual(
      mergeSimConfigWithDefaults({}),
    );
    expect(mergeSimConfigWithDefaults(undefined)).toEqual(
      mergeSimConfigWithDefaults({}),
    );
  });

  it('normalizes a merged omnet.protocol of DSRC to ITS-G5', () => {
    const merged = mergeSimConfigWithDefaults({
      omnet: { ...defaultSimConfig.omnet, protocol: 'DSRC' },
    });

    expect(merged.omnet.protocol).toBe('ITS-G5');
  });

  it('uses the given sumo.vtypes when present, instead of the default list', () => {
    const customVtypes = [
      {
        id: 'custom',
        minGap: 1,
        tau: 0.5,
        vClass: 'truck',
        carFollowModel: 'IDM',
        speedFactor: 'normc(1,0)',
      },
    ];

    const merged = mergeSimConfigWithDefaults({
      sumo: { ...defaultSimConfig.sumo, vtypes: customVtypes },
    });

    expect(merged.sumo.vtypes).toBe(customVtypes);
  });

  it('falls back to the default sumo.vtypes when not given', () => {
    const merged = mergeSimConfigWithDefaults({});

    expect(merged.sumo.vtypes).toBe(defaultSimConfig.sumo.vtypes);
  });

  it('uses the given carla.weather_override when the key is present, even as an empty object', () => {
    const merged = mergeSimConfigWithDefaults({
      carla: { ...defaultSimConfig.carla, weather_override: {} },
    });

    expect(merged.carla.weather_override).toEqual({});
  });

  it('falls back to an empty object when the carla.weather_override key is present but its value is undefined', () => {
    const merged = mergeSimConfigWithDefaults({
      carla: {
        ...defaultSimConfig.carla,
        weather_override: undefined as never,
      },
    });

    expect(merged.carla.weather_override).toEqual({});
  });

  it('falls back to the default carla.weather_override when the carla.weather_override key is absent entirely', () => {
    const { weather_override: carlaWithoutOverride } = defaultSimConfig.carla;

    const merged = mergeSimConfigWithDefaults({
      carla: carlaWithoutOverride as never,
    });

    expect(merged.carla.weather_override).toEqual(
      defaultSimConfig.carla.weather_override,
    );
  });

  it('uses the given capi.extra_configs when present, instead of the default list', () => {
    const customConfigs = [
      {
        name: 'custom',
        path_loss_type: 'FreeSpace',
        small_scale_variations: false,
        visualization: false,
      },
    ];

    const merged = mergeSimConfigWithDefaults({
      capi: { ...defaultSimConfig.capi, extra_configs: customConfigs },
    });

    expect(merged.capi.extra_configs).toBe(customConfigs);
  });

  it('falls back to the default capi.extra_configs when not given', () => {
    const merged = mergeSimConfigWithDefaults({});

    expect(merged.capi.extra_configs).toBe(defaultSimConfig.capi.extra_configs);
  });
});
