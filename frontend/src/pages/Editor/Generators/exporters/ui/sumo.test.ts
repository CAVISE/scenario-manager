import { describe, expect, it } from 'vitest';

import type { Car } from '../../../../../store/types/useEditorStoreTypes';
import { defaultSimConfig } from '../../types/configGeneratorsTypes';
import { generateRouXml, generateSumoCfg } from './sumo';

describe('SUMO exporters', () => {
  it('uses the exported config basename for related files and the CARLA map xodr', () => {
    const config = {
      ...defaultSimConfig,
      carla: { ...defaultSimConfig.carla, map: 'Town01' },
      sumo: {
        ...defaultSimConfig.sumo,
        scenario_name: 'hardcoded-name',
      },
    };

    const xml = generateSumoCfg(config, 'sm_poc_town01.sumocfg');

    expect(xml).toContain('<net-file value="../maps/Town01.xodr"/>');
    expect(xml).toContain('<route-files value="sm_poc_town01.rou.xml"/>');
    expect(xml).toContain('<additional-files value="sm_poc_town01.poly.xml"/>');
    expect(xml).not.toContain('hardcoded-name.rou.xml');
  });

  it('falls back to the configured scenario name without an output filename', () => {
    const xml = generateSumoCfg({
      ...defaultSimConfig,
      sumo: { ...defaultSimConfig.sumo, scenario_name: 'my-scenario' },
    });

    expect(xml).toContain('<route-files value="my-scenario.rou.xml"/>');
    expect(xml).toContain('<additional-files value="my-scenario.poly.xml"/>');
  });

  it('writes the route edges stored on each vehicle', () => {
    const car = {
      id: 'car-1',
      x: 0,
      y: 0,
      z: 0,
      color: 'ffffff',
      model: 'vehicle.tesla.model3',
      scale: 1,
      rotation: 0,
      speed: 50,
      sumo_edges: '27 26 -35.0.00',
    } satisfies Car;

    const xml = generateRouXml(defaultSimConfig, [car]);

    expect(xml).toContain('<route edges="27 26 -35.0.00"/>');
  });
});
