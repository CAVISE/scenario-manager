import { describe, it, expect } from 'vitest';
import {
  fmtRgb,
  pushVehicleBehaviorServices,
  pushLocalizationMetrics,
  pushBehaviorMetrics,
  pushPlatoonBase,
  pushCoopPerception,
  pushCavSensingOverride,
} from './opencdaYamlSections';
import { defaultSimConfig } from '../types/configGeneratorsTypes';
import type { Car, Lidar } from '@/store/types/useEditorStoreTypes';

const makeCar = (overrides: Partial<Car> = {}): Car =>
  ({
    id: 'car-1',
    x: 0,
    y: 0,
    z: 0,
    color: 'ffffff',
    model: 'vehicle.tesla.model3',
    scale: 1,
    rotation: 0,
    speed: 0,
    ...overrides,
  }) as Car;

const makeLidar = (overrides: Partial<Lidar> = {}): Lidar =>
  ({
    id: 'l1',
    carId: 'car-1',
    x: 0,
    y: 0,
    z: 1,
    rotation: 0,
    range: 50,
    channels: 32,
    rotation_frequency: 20,
    ...overrides,
  }) as Lidar;

describe('pushCavSensingOverride', () => {
  it('pushes nothing when the car has no opencda_sensing config and no lidar is given', () => {
    const lines: string[] = [];

    pushCavSensingOverride(
      lines,
      makeCar({ opencda_sensing: undefined }),
      '  ',
    );

    expect(lines).toEqual([]);
  });

  it('pushes the sensing/perception header when only opencda_sensing is set (no lidar)', () => {
    const lines: string[] = [];
    const car = makeCar({ opencda_sensing: { perception_activate: true } });

    pushCavSensingOverride(lines, car, '  ');

    expect(lines).toContain('  sensing:');
    expect(lines).toContain('    perception:');
  });

  it('pushes the sensing/perception header when only a lidar is given (no opencda_sensing)', () => {
    const lines: string[] = [];

    pushCavSensingOverride(
      lines,
      makeCar({ opencda_sensing: undefined }),
      '  ',
      makeLidar(),
    );

    expect(lines).toContain('  sensing:');
    expect(lines).toContain('    perception:');
  });

  describe('perception.activate', () => {
    it('uses the explicit perception_activate value (true) even when a lidar is also present', () => {
      const lines: string[] = [];
      const car = makeCar({
        opencda_sensing: { perception_activate: true },
      });

      pushCavSensingOverride(lines, car, '  ', makeLidar());

      expect(lines).toContain('      activate: true');
    });

    it('uses the explicit perception_activate value (false), not defaulting to true because a lidar exists', () => {
      const lines: string[] = [];
      const car = makeCar({
        opencda_sensing: { perception_activate: false },
      });

      pushCavSensingOverride(lines, car, '  ', makeLidar());

      expect(lines).toContain('      activate: false');
    });

    it('defaults activate to true when perception_activate is unset but a lidar is present', () => {
      const lines: string[] = [];
      const car = makeCar({
        opencda_sensing: { camera_num: 2 },
      });

      pushCavSensingOverride(lines, car, '  ', makeLidar());

      expect(lines).toContain('      activate: true');
    });

    it('omits the activate line entirely when perception_activate is unset and there is no lidar', () => {
      const lines: string[] = [];
      const car = makeCar({
        opencda_sensing: { camera_num: 2 },
      });

      pushCavSensingOverride(lines, car, '  ');

      expect(lines.some((l) => l.includes('activate:'))).toBe(false);
    });
  });

  describe('camera block', () => {
    it('omits the camera block entirely when neither camera_visualize nor camera_num is set', () => {
      const lines: string[] = [];
      const car = makeCar({
        opencda_sensing: { perception_activate: true },
      });

      pushCavSensingOverride(lines, car, '  ');

      expect(lines.some((l) => l.includes('camera:'))).toBe(false);
    });

    it('emits both visualize and num when both are set', () => {
      const lines: string[] = [];
      const car = makeCar({
        opencda_sensing: { camera_visualize: 1, camera_num: 4 },
      });

      pushCavSensingOverride(lines, car, '  ');

      expect(lines).toContain('      camera:');
      expect(lines).toContain('        visualize: 1');
      expect(lines).toContain('        num: 4');
    });

    it('emits only visualize when camera_num is unset', () => {
      const lines: string[] = [];
      const car = makeCar({
        opencda_sensing: { camera_visualize: 0 },
      });

      pushCavSensingOverride(lines, car, '  ');

      expect(lines).toContain('      camera:');
      expect(lines).toContain('        visualize: 0');
      expect(lines.some((l) => l.includes('num:'))).toBe(false);
    });

    it('emits only num when camera_visualize is unset', () => {
      const lines: string[] = [];
      const car = makeCar({
        opencda_sensing: { camera_num: 3 },
      });

      pushCavSensingOverride(lines, car, '  ');

      expect(lines).toContain('      camera:');
      expect(lines).toContain('        num: 3');
      expect(lines.some((l) => l.includes('visualize:'))).toBe(false);
    });
  });

  describe('lidar block', () => {
    it('omits the lidar block entirely when no lidar-related field or lidar object is present', () => {
      const lines: string[] = [];
      const car = makeCar({
        opencda_sensing: { camera_num: 2 },
      });

      pushCavSensingOverride(lines, car, '  ');

      expect(lines.some((l) => l.includes('lidar:'))).toBe(false);
    });

    it('emits the lidar block from a lidar object alone, with no opencda_sensing lidar fields set', () => {
      const lines: string[] = [];
      const car = makeCar({ opencda_sensing: undefined });

      pushCavSensingOverride(
        lines,
        car,
        '  ',
        makeLidar({ channels: 64, range: 120, rotation_frequency: 10 }),
      );

      expect(lines).toContain('      lidar:');
      expect(lines).toContain('        channels: 64');
      expect(lines).toContain('        range: 120');
      expect(lines).toContain('        rotation_frequency: 10');
      expect(lines.some((l) => l.includes('visualize:'))).toBe(false);
    });

    it('prefers opencda_sensing.lidar_channels/lidar_range over the lidar object when both are present', () => {
      const lines: string[] = [];
      const car = makeCar({
        opencda_sensing: { lidar_channels: 16, lidar_range: 30 },
      });

      pushCavSensingOverride(
        lines,
        car,
        '  ',
        makeLidar({ channels: 64, range: 120 }),
      );

      expect(lines).toContain('        channels: 16');
      expect(lines).toContain('        range: 30');
    });

    it('falls back to the lidar object channels/range when opencda_sensing has visualize set but not channels/range', () => {
      const lines: string[] = [];
      const car = makeCar({
        opencda_sensing: { lidar_visualize: true },
      });

      pushCavSensingOverride(
        lines,
        car,
        '  ',
        makeLidar({ channels: 48, range: 90 }),
      );

      expect(lines).toContain('        visualize: true');
      expect(lines).toContain('        channels: 48');
      expect(lines).toContain('        range: 90');
    });

    it('omits rotation_frequency when there is no lidar object, even if lidar fields are set via opencda_sensing', () => {
      const lines: string[] = [];
      const car = makeCar({
        opencda_sensing: { lidar_channels: 32, lidar_range: 50 },
      });

      pushCavSensingOverride(lines, car, '  ');

      expect(lines).toContain('      lidar:');
      expect(lines).toContain('        channels: 32');
      expect(lines).toContain('        range: 50');
      expect(lines.some((l) => l.includes('rotation_frequency:'))).toBe(false);
    });

    it('respects the given indent for every emitted line', () => {
      const lines: string[] = [];
      const car = makeCar({
        opencda_sensing: {
          perception_activate: true,
          camera_num: 1,
        },
      });

      pushCavSensingOverride(lines, car, '    ', makeLidar());

      expect(lines).toEqual([
        '    sensing:',
        '      perception:',
        '        activate: true',
        '        camera:',
        '          num: 1',
        '        lidar:',
        '          channels: 32',
        '          range: 50',
        '          rotation_frequency: 20',
      ]);
    });
  });
});

describe('fmtRgb', () => {
  it('formats an [r, g, b] tuple as a bracketed, comma-space-separated list', () => {
    expect(fmtRgb([17, 34, 42])).toBe('[17, 34, 42]');
  });

  it('handles zero and non-integer channel values as-is', () => {
    expect(fmtRgb([0, 255, 128.5])).toBe('[0, 255, 128.5]');
  });
});

describe('pushVehicleBehaviorServices', () => {
  it('pushes the header and both service entries when both flags are enabled', () => {
    const lines: string[] = [];

    pushVehicleBehaviorServices(lines, {
      self_informer: true,
      movement_controller: true,
    });

    expect(lines).toEqual([
      '  behavior_services:',
      '    - type: self_informer',
      '    - type: movement_controller',
    ]);
  });

  it('pushes only self_informer when movement_controller is disabled', () => {
    const lines: string[] = [];

    pushVehicleBehaviorServices(lines, {
      self_informer: true,
      movement_controller: false,
    });

    expect(lines).toEqual([
      '  behavior_services:',
      '    - type: self_informer',
    ]);
  });

  it('pushes only movement_controller when self_informer is disabled', () => {
    const lines: string[] = [];

    pushVehicleBehaviorServices(lines, {
      self_informer: false,
      movement_controller: true,
    });

    expect(lines).toEqual([
      '  behavior_services:',
      '    - type: movement_controller',
    ]);
  });

  it('pushes only the header when both flags are disabled', () => {
    const lines: string[] = [];

    pushVehicleBehaviorServices(lines, {
      self_informer: false,
      movement_controller: false,
    });

    expect(lines).toEqual(['  behavior_services:']);
  });
});

describe('pushLocalizationMetrics', () => {
  it('pushes the metrics/trace block with the given warmup value at the given indent', () => {
    const lines: string[] = [];

    pushLocalizationMetrics(lines, 5, '  ');

    expect(lines).toEqual([
      '  metrics:',
      '    metric_configs:',
      '      trace:',
      '        warmup_steps: 5',
    ]);
  });

  it('applies a different indent verbatim', () => {
    const lines: string[] = [];

    pushLocalizationMetrics(lines, 0, '');

    expect(lines).toEqual([
      'metrics:',
      '  metric_configs:',
      '    trace:',
      '      warmup_steps: 0',
    ]);
  });
});

describe('pushBehaviorMetrics', () => {
  it('pushes one warmup_steps block per metric field, in a fixed field order', () => {
    const lines: string[] = [];

    pushBehaviorMetrics(lines, {
      localization_trace_warmup: 0,
      behavior_speed_warmup: 1,
      behavior_acceleration_warmup: 2,
      behavior_ttc_warmup: 3,
      behavior_hard_brake_warmup: 4,
    });

    expect(lines).toEqual([
      '    metrics:',
      '      metric_configs:',
      '        speed:',
      '          warmup_steps: 1',
      '        acceleration:',
      '          warmup_steps: 2',
      '        ttc:',
      '          warmup_steps: 3',
      '        hard_brake_count:',
      '          warmup_steps: 4',
    ]);
  });

  it('does not emit a localization_trace_warmup entry (that field belongs to pushLocalizationMetrics instead)', () => {
    const lines: string[] = [];

    pushBehaviorMetrics(lines, {
      localization_trace_warmup: 999,
      behavior_speed_warmup: 1,
      behavior_acceleration_warmup: 1,
      behavior_ttc_warmup: 1,
      behavior_hard_brake_warmup: 1,
    });

    expect(lines.some((l) => l.includes('999'))).toBe(false);
  });
});

describe('pushPlatoonBase', () => {
  const baseParams = defaultSimConfig.opencda.platoon_base;

  it('pushes the core platoon fields and a trailing blank line, without a metrics block, when includeMetrics is false', () => {
    const lines: string[] = [];

    pushPlatoonBase(lines, baseParams, false);

    expect(lines).toEqual([
      'platoon_base:',
      `  max_capacity: ${baseParams.max_capacity}`,
      `  inter_gap: ${baseParams.inter_gap}`,
      `  open_gap: ${baseParams.open_gap}`,
      `  warm_up_speed: ${baseParams.warm_up_speed}`,
      `  change_leader_speed: ${baseParams.change_leader_speed}`,
      `  leader_speeds_profile: [ ${baseParams.leader_speeds_profile[0]}, ${baseParams.leader_speeds_profile[1]} ]`,
      `  stage_duration: ${baseParams.stage_duration}`,
      '',
    ]);
  });

  it('appends a metrics block with time_gap and distance_gap warmups when includeMetrics is true', () => {
    const lines: string[] = [];

    pushPlatoonBase(lines, baseParams, true);

    expect(lines).toContain('  metrics:');
    expect(lines).toContain('    metric_configs:');
    expect(lines).toContain('      time_gap:');
    expect(lines).toContain(
      `        warmup_steps: ${baseParams.metric_time_gap_warmup}`,
    );
    expect(lines).toContain('      distance_gap:');
    expect(lines).toContain(
      `        warmup_steps: ${baseParams.metric_distance_gap_warmup}`,
    );

    expect(lines[lines.length - 1]).toBe('');
  });

  it('formats the two-element leader_speeds_profile array with spaces inside the brackets', () => {
    const lines: string[] = [];

    pushPlatoonBase(
      lines,
      { ...baseParams, leader_speeds_profile: [70, 100] },
      false,
    );

    expect(lines).toContain('  leader_speeds_profile: [ 70, 100 ]');
  });
});

describe('pushCoopPerception', () => {
  const baseParams = defaultSimConfig.opencda.coop_perception;

  it('pushes the header, formatted RGB colors, and numeric fields, ending with a blank line', () => {
    const lines: string[] = [];

    pushCoopPerception(lines, baseParams);

    expect(lines).toEqual([
      'cooperative_perception_visualization:',
      `  background: ${fmtRgb(baseParams.background)}`,
      `  bbox_line_thickness: ${baseParams.bbox_line_thickness}`,
      `  image_dpi: ${baseParams.image_dpi}`,
      '  lidar_point_colors:',
      `    other: ${fmtRgb(baseParams.lidar_other_color)}`,
      '  bbox_colors:',
      `    gt: ${fmtRgb(baseParams.bbox_gt_color)}`,
      `    pred: ${fmtRgb(baseParams.bbox_pred_color)}`,
      '',
    ]);
  });

  it('uses distinct colors for each of the four color fields when they differ', () => {
    const lines: string[] = [];

    pushCoopPerception(lines, {
      ...baseParams,
      background: [1, 2, 3],
      lidar_other_color: [4, 5, 6],
      bbox_gt_color: [7, 8, 9],
      bbox_pred_color: [10, 11, 12],
    });

    expect(lines).toContain('  background: [1, 2, 3]');
    expect(lines).toContain('    other: [4, 5, 6]');
    expect(lines).toContain('    gt: [7, 8, 9]');
    expect(lines).toContain('    pred: [10, 11, 12]');
  });
});
