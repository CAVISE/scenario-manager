import { describe, expect, it } from 'vitest';

import type {
  Building,
  Car,
} from '../../../../../store/types/useEditorStoreTypes';
import { defaultSimConfig } from '../../types/configGeneratorsTypes';
import { generatePolyXml, useGenerateRouXml, useGenerateSumoCfg } from './sumo';
import { getSumoCoordinateOffsets } from './sumoNetwork';

const NET_XML = `<?xml version="1.0" encoding="UTF-8"?>
<net>
  <location netOffset="100.0,200.0"/>
  <edge id="edge-a">
    <lane id="edge-a_0" index="0" length="10" shape="100,200 110,200"/>
  </edge>
</net>`;

describe('SUMO exporters', () => {
  it('applies OpenDRIVE and SUMO offsets to building polygons', () => {
    const building = {
      id: 'building-1',
      name: 'test-building',
      x: 10,
      y: 20,
      z: 0,
      width: 20,
      depth: 10,
      height: 10,
      scale: 1,
      rotation: 0,
      material: 'concrete',
    } satisfies Building;
    const offsets = getSumoCoordinateOffsets(NET_XML, { x: 5, y: -30 });

    const xml = generatePolyXml([building], offsets);

    expect(xml).toContain(
      'shape="105.000000,185.000000 125.000000,185.000000 125.000000,195.000000 105.000000,195.000000 105.000000,185.000000"',
    );
  });

  it('uses local SUMO artifacts and the exported config basename', () => {
    const config = {
      ...defaultSimConfig,
      carla: { ...defaultSimConfig.carla, map: 'Town01' },
      sumo: {
        ...defaultSimConfig.sumo,
        scenario_name: 'hardcoded-name',
      },
    };

    const xml = useGenerateSumoCfg(config, 'sm_poc_town01.sumocfg');

    expect(xml).toContain('<net-file value="./Town01.net.xml"/>');
    expect(xml).toContain('<route-files value="./sm_poc_town01.rou.xml"/>');
    expect(xml).toContain(
      '<additional-files value="./sm_poc_town01.poly.xml"/>',
    );
    expect(xml).not.toContain('hardcoded-name.rou.xml');
  });

  it('falls back to the configured scenario name without an output filename', () => {
    const xml = useGenerateSumoCfg({
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

    const xml = useGenerateRouXml(defaultSimConfig, [car]);

    expect(xml).toContain('<route edges="27 26 -35.0.00"/>');
  });

  it('sorts vehicles by departure time while preserving their SUMO ids', () => {
    const cars = [
      {
        id: 'car-0',
        x: 0,
        y: 0,
        z: 0,
        color: 'ffffff',
        model: 'vehicle.tesla.model3',
        scale: 1,
        rotation: 0,
        speed: 50,
        sumo_edges: 'edge-a',
        sumo_depart: 0.1,
      },
      {
        id: 'car-1',
        x: 0,
        y: 0,
        z: 0,
        color: 'ffffff',
        model: 'vehicle.tesla.model3',
        scale: 1,
        rotation: 0,
        speed: 50,
        sumo_edges: 'edge-b',
        sumo_depart: 0.05,
      },
      {
        id: 'car-2',
        x: 0,
        y: 0,
        z: 0,
        color: 'ffffff',
        model: 'vehicle.tesla.model3',
        scale: 1,
        rotation: 0,
        speed: 50,
        sumo_edges: 'edge-c',
        sumo_depart: 0.05,
      },
    ] satisfies Car[];

    const xml = useGenerateRouXml(defaultSimConfig, cars);
    const sumo0Position = xml.indexOf('<vehicle id="sumo0"');
    const sumo1Position = xml.indexOf('<vehicle id="sumo1"');
    const sumo2Position = xml.indexOf('<vehicle id="sumo2"');

    expect(sumo1Position).toBeLessThan(sumo2Position);
    expect(sumo2Position).toBeLessThan(sumo0Position);
    expect(xml.slice(sumo0Position)).toContain('<route edges="edge-a"/>');
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

    const xml = useGenerateRouXml(defaultSimConfig, [car], {
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

    const xml = useGenerateRouXml(defaultSimConfig, [car], {
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

    const xml = useGenerateRouXml(defaultSimConfig, [car], {
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

  it('rejects a static stop with an empty lane', () => {
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
      sumo_edges: 'edge-a',
      sumo_stop: {
        lane: '',
        startPos: 1,
        endPos: 2,
        duration: 10,
      },
    } satisfies Car;

    expect(() => useGenerateRouXml(defaultSimConfig, [car])).toThrow(
      'Static stop is enabled but its Lane field is empty',
    );
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

    expect(() => useGenerateRouXml(defaultSimConfig, [car])).toThrow(
      'has no SUMO route',
    );
  });
});
