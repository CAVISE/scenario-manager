import { describe, expect, it } from 'vitest';

import type { Car } from '../../../../../store/types/useEditorStoreTypes';
import { defaultSimConfig } from '../../types/configGeneratorsTypes';
import { generateRouXml, generateSumoCfg } from './sumo';

describe('SUMO exporters', () => {
  it('uses local SUMO artifacts and the exported config basename', () => {
    const config = {
      ...defaultSimConfig,
      carla: { ...defaultSimConfig.carla, map: 'Town01' },
      sumo: {
        ...defaultSimConfig.sumo,
        scenario_name: 'hardcoded-name',
      },
    };

    const xml = generateSumoCfg(config, 'sm_poc_town01.sumocfg');

    expect(xml).toContain('<net-file value="./Town01.net.xml"/>');
    expect(xml).toContain('<route-files value="./sm_poc_town01.rou.xml"/>');
    expect(xml).toContain(
      '<additional-files value="./sm_poc_town01.poly.xml"/>',
    );
    expect(xml).not.toContain('hardcoded-name.rou.xml');
  });

  it('falls back to the configured scenario name without an output filename', () => {
    const xml = generateSumoCfg({
      ...defaultSimConfig,
      sumo: { ...defaultSimConfig.sumo, scenario_name: 'my-scenario' },
    });

    expect(xml).toContain('<route-files value="./my-scenario.rou.xml"/>');
    expect(xml).toContain('<additional-files value="./my-scenario.poly.xml"/>');
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

  it('writes generated edge routes when there is no manual override', () => {
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
    } satisfies Car;

    const xml = generateRouXml(defaultSimConfig, [car], {
      'car-1': {
        edges: 'edge-a edge-b edge-c',
        depart: {
          edgeId: 'edge-a',
          laneId: 'edge-a_1',
          laneIndex: 1,
          pos: 12.345,
          distance: 0.5,
        },
        arrival: {
          edgeId: 'edge-c',
          laneId: 'edge-c_0',
          laneIndex: 0,
          pos: 8.765,
          distance: 0.25,
        },
        warnings: [],
      },
    });

    expect(xml).toContain('<route edges="edge-a edge-b edge-c"/>');
    expect(xml).toContain('departLane="1"');
    expect(xml).toContain('departPos="12.35"');
    expect(xml).toContain('arrivalLane="0"');
    expect(xml).toContain('arrivalPos="8.77"');
  });

  it('keeps manual edges as an override over generated routes', () => {
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
      sumo_edges: 'manual-a manual-b',
    } satisfies Car;

    const xml = generateRouXml(defaultSimConfig, [car], {
      'car-1': {
        edges: 'generated-a generated-b',
        warnings: [],
      },
    });

    expect(xml).toContain('<route edges="manual-a manual-b"/>');
    expect(xml).not.toContain('generated-a');
  });

  it('keeps manual departure values over generated anchors', () => {
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
      sumo_depart_lane: 'best',
      sumo_depart_pos: 42,
    } satisfies Car;

    const xml = generateRouXml(defaultSimConfig, [car], {
      'car-1': {
        edges: 'edge-a edge-b',
        depart: {
          edgeId: 'edge-a',
          laneId: 'edge-a_1',
          laneIndex: 1,
          pos: 12.345,
          distance: 0.5,
        },
        warnings: [],
      },
    });

    expect(xml).toContain('departLane="best"');
    expect(xml).toContain('departPos="42"');
    expect(xml).not.toContain('departLane="1"');
    expect(xml).not.toContain('departPos="12.35"');
  });

  it('does not silently export a vehicle with an empty route', () => {
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
    } satisfies Car;

    expect(() => generateRouXml(defaultSimConfig, [car])).toThrow(
      'has no SUMO route',
    );
  });
});
