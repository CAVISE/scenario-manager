import { describe, expect, it } from 'vitest';

import type { Car, Lidar, Point, RSU } from '@/store/types/useEditorStoreTypes';
import { buildOpenCDAArtifact } from './opencdaArtifact';
import { defaultSimConfig } from './types/configGeneratorsTypes';

const car: Car = {
  id: 'car-1',
  x: 1,
  y: 2,
  z: 0,
  color: '#0000ff',
  model: 'car',
  scale: 1,
  rotation: 0,
  speed: 0,
  opencda_carla_model: 'vehicle.audi.a2',
};

const point: Point = {
  id: 'point-1',
  carId: car.id,
  x: 10,
  y: 20,
  z: 0,
};

const lidar: Lidar = {
  id: 'lidar-1',
  carId: car.id,
  x: 0,
  y: 0,
  z: 1,
  rotation: 0,
  range: 80,
  channels: 64,
  rotation_frequency: 15,
};

const rsu = {
  id: 'rsu-1',
  name: 'RSU 1',
  x: 3,
  y: 4,
  z: 1,
  range: 120,
  tx_power: 23,
  frequency: 5.9e9,
  protocol: 'ITS-G5',
  beacon_interval: 1000,
} as RSU;

describe('buildOpenCDAArtifact', () => {
  it('builds a self-contained config from base defaults and editor objects', () => {
    const yaml = buildOpenCDAArtifact({
      simConfig: defaultSimConfig,
      cars: [car],
      RSUs: [rsu],
      points: [point],
      lidars: [lidar],
    });

    expect(yaml).toContain('world:');
    expect(yaml).toContain('vehicle_base:');
    expect(yaml).toContain('navigation_source: estimated');
    expect(yaml).toContain('position_source: estimated');
    expect(yaml).toContain('  map_manager:');
    expect(yaml).toContain('  safety_manager:');
    expect(yaml).toContain('  controller:');
    expect(yaml).toContain('rsu_base:');
    expect(yaml).toContain('carla_traffic_manager:');
    expect(yaml).toContain('  port: 8001');
    expect(yaml).toContain('traffic_manager:');
    expect(yaml).toContain('    max_speed: 45');
    expect(yaml).toContain('      debug: true');
    expect(yaml).toContain('      debug_trajectory: true');
    expect(yaml).toContain('      activate: true');
    expect(yaml).toContain('  vehicle_list: []');
    expect(yaml).toContain('  range: []');
    expect(yaml).toContain('      model: vehicle.audi.a2');
    expect(yaml).toContain('        channels: 64');
    expect(yaml).toContain('        range: 80');
    expect(yaml).not.toContain('base.yaml');
  });

  it('exports attacks directly without the legacy wrapper', () => {
    const yaml = buildOpenCDAArtifact({
      simConfig: {
        ...defaultSimConfig,
        attacks: [
          {
            name: 'gnss-spoof',
            requirements: {},
            targets: { cav_index: 1 },
            stages: [
              {
                id: 'stage-1',
                type: 'spoofer',
                params: { intensity: 'high' },
              },
            ],
          },
        ],
      },
      cars: [car],
      RSUs: [],
      points: [point],
      lidars: [],
    });

    expect(yaml).toMatch(/attacks:\n {2}-\n {4}name: "?gnss-spoof"?/);
    expect(yaml).toContain('    requirements: {}');
    expect(yaml).not.toContain('    attack:');
  });
});
