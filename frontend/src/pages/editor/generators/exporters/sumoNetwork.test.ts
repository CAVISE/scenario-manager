import { readFileSync } from 'fs';
import { resolve } from 'path';
import process from 'process';

import { afterEach, describe, expect, it, vi } from 'vitest';

import type { Car, Point } from '../../../../store/editor-store.types';
import {
  buildSumoRoutes,
  clearLoadedSumoNetwork,
  resolveSumoNetwork,
  setLoadedSumoNetwork,
} from './sumoNetwork';

const NET_XML = `<?xml version="1.0" encoding="UTF-8"?>
<net>
  <location netOffset="100.0,200.0"/>
  <edge id="edge-a">
    <lane id="edge-a_0" index="0" length="10" shape="100,200 110,200"/>
  </edge>
  <edge id="edge-b">
    <lane id="edge-b_0" index="0" length="10" shape="110,200 120,200"/>
  </edge>
  <edge id="edge-c">
    <lane id="edge-c_0" index="0" length="10" shape="120,200 130,200"/>
  </edge>
  <connection from="edge-a" to="edge-b" fromLane="0" toLane="0"/>
  <connection from="edge-b" to="edge-c" fromLane="0" toLane="0"/>
</net>`;
const TOWN01_NET_XML = readFileSync(
  resolve(process.cwd(), 'public/Town01.net.xml'),
  'utf8',
);

const car = {
  id: 'car-1',
  x: 1,
  y: 0,
  z: 0,
  color: 'ffffff',
  model: 'vehicle.tesla.model3',
  scale: 1,
  rotation: 0,
  speed: 50,
} satisfies Car;

const destination = {
  id: 'point-1',
  carId: car.id,
  x: 29,
  y: 0,
  z: 0,
} satisfies Point;

afterEach(() => {
  clearLoadedSumoNetwork();
  vi.unstubAllGlobals();
});

describe('SUMO frontend routing', () => {
  it('uses OpenDRIVE map offsets for distinct Town01 vehicle spawns', () => {
    const townCars = [
      { ...car, id: 'cav1', x: -118.9, y: -107.47 },
      { ...car, id: 'cav2', x: -212.91, y: 118.92 },
      { ...car, id: 'cav3', x: 13.93, y: 64.31 },
      { ...car, id: 'cav4', x: 2.41, y: -3.5 },
    ];
    const destinations = [
      { id: 'p1', carId: 'cav1', x: -88.59, y: 67.63, z: 0 },
      { id: 'p2', carId: 'cav2', x: -125.35, y: -142.57, z: 0 },
      { id: 'p3', carId: 'cav3', x: -115.93, y: -40.82, z: 0 },
      { id: 'p4', carId: 'cav4', x: -125.44, y: -59.85, z: 0 },
    ];

    const routes = buildSumoRoutes(TOWN01_NET_XML, townCars, destinations, {
      x: 212.00307621889581,
      y: -123.08861225209964,
    });

    expect(townCars.map(({ id }) => routes[id].edges.split(' ')[0])).toEqual([
      '24',
      '13',
      '-10',
      '4',
    ]);
    expect(townCars.map(({ id }) => routes[id].depart?.edgeId)).toEqual([
      '24',
      '13',
      '-10',
      '4',
    ]);
  });

  it('maps CARLA coordinates and fills intermediate SUMO edges', () => {
    expect(buildSumoRoutes(NET_XML, [car], [destination])).toEqual({
      'car-1': {
        edges: 'edge-a edge-b edge-c',
        depart: {
          edgeId: 'edge-a',
          laneId: 'edge-a_0',
          laneIndex: 0,
          pos: 1,
          distance: 0,
        },
        arrival: {
          edgeId: 'edge-c',
          laneId: 'edge-c_0',
          laneIndex: 0,
          pos: 9,
          distance: 0,
        },
        warnings: [],
      },
    });
  });

  it('prefers driving lanes over sidewalk geometry', () => {
    const network = `<?xml version="1.0" encoding="UTF-8"?>
<net>
  <location netOffset="0,0"/>
  <edge id="edge-a">
    <lane id="edge-a_0" index="0" type="sidewalk" length="20" shape="0,0 20,0"/>
    <lane id="edge-a_1" index="1" type="driving" length="20" shape="0,2 20,2"/>
  </edge>
</net>`;
    const localCar = { ...car, x: 2, y: 0 };
    const localDestination = { ...destination, x: 18, y: 0 };

    expect(
      buildSumoRoutes(network, [localCar], [localDestination])['car-1'],
    ).toEqual({
      edges: 'edge-a',
      depart: {
        edgeId: 'edge-a',
        laneId: 'edge-a_1',
        laneIndex: 1,
        pos: 2,
        distance: 2,
      },
      arrival: {
        edgeId: 'edge-a',
        laneId: 'edge-a_1',
        laneIndex: 1,
        pos: 18,
        distance: 2,
      },
      warnings: [],
    });
  });

  it('uses a departure lane that connects to the next route edge', () => {
    const network = `<?xml version="1.0" encoding="UTF-8"?>
<net>
  <location netOffset="0,0"/>
  <edge id="edge-a">
    <lane id="edge-a_0" index="0" type="driving" length="10" shape="0,0 10,0"/>
    <lane id="edge-a_1" index="1" type="driving" length="10" shape="0,2 10,2"/>
  </edge>
  <edge id="edge-b">
    <lane id="edge-b_0" index="0" type="driving" length="10" shape="10,0 20,0"/>
  </edge>
  <connection from="edge-a" to="edge-b" fromLane="1" toLane="0"/>
</net>`;
    const localCar = { ...car, x: 1, y: 0 };
    const localDestination = { ...destination, x: 19, y: 0 };

    expect(
      buildSumoRoutes(network, [localCar], [localDestination])['car-1'],
    ).toEqual({
      edges: 'edge-a edge-b',
      depart: {
        edgeId: 'edge-a',
        laneId: 'edge-a_1',
        laneIndex: 1,
        pos: 1,
        distance: 2,
      },
      arrival: {
        edgeId: 'edge-b',
        laneId: 'edge-b_0',
        laneIndex: 0,
        pos: 9,
        distance: 0,
      },
      warnings: [],
    });
  });

  it('falls back to the default SUMO positions for a reversed single edge', () => {
    const localCar = { ...car, x: 8, y: 0 };
    const localDestination = { ...destination, x: 2, y: 0 };

    expect(
      buildSumoRoutes(NET_XML, [localCar], [localDestination])['car-1'],
    ).toEqual({
      edges: 'edge-a',
      depart: undefined,
      arrival: undefined,
      warnings: ['arrival is not ahead of departure on the single-edge route'],
    });
  });

  it('anchors a manually configured route from the vehicle spawn', () => {
    expect(
      buildSumoRoutes(NET_XML, [{ ...car, sumo_edges: 'edge-a edge-b' }], []),
    ).toEqual({
      'car-1': {
        edges: 'edge-a edge-b',
        depart: {
          edgeId: 'edge-a',
          laneId: 'edge-a_0',
          laneIndex: 0,
          pos: 1,
          distance: 0,
        },
        warnings: [],
      },
    });
  });

  it('rejects a manual route whose first edge does not contain the spawn', () => {
    expect(() =>
      buildSumoRoutes(
        NET_XML,
        [{ ...car, sumo_edges: 'edge-c' }],
        [destination],
      ),
    ).toThrow('scene spawn is not on the first manual SUMO edge edge-c');
  });

  it('adds endpoint anchors to a manual edge route when points exist', () => {
    expect(
      buildSumoRoutes(
        NET_XML,
        [{ ...car, sumo_edges: 'edge-a edge-b edge-c' }],
        [destination],
      ),
    ).toEqual({
      'car-1': {
        edges: 'edge-a edge-b edge-c',
        depart: {
          edgeId: 'edge-a',
          laneId: 'edge-a_0',
          laneIndex: 0,
          pos: 1,
          distance: 0,
        },
        arrival: {
          edgeId: 'edge-c',
          laneId: 'edge-c_0',
          laneIndex: 0,
          pos: 9,
          distance: 0,
        },
        warnings: [],
      },
    });
  });

  it('rejects a manual departure lane that is absent from the first edge', () => {
    expect(() =>
      buildSumoRoutes(
        NET_XML,
        [
          {
            ...car,
            sumo_edges: 'edge-a edge-b',
            sumo_depart_lane: '4',
          },
        ],
        [],
      ),
    ).toThrow('departLane 4 is not a passenger driving lane on edge edge-a');
  });

  it('rejects a static stop with an empty lane', () => {
    expect(() =>
      buildSumoRoutes(
        NET_XML,
        [
          {
            ...car,
            sumo_edges: 'edge-a edge-b',
            sumo_stop: {
              lane: '',
              startPos: 1,
              endPos: 2,
              duration: 10,
            },
          },
        ],
        [],
      ),
    ).toThrow('Static stop is enabled but its Lane field is empty');
  });

  it('rejects automatic routing when a vehicle has no route points', () => {
    expect(() => buildSumoRoutes(NET_XML, [car], [])).toThrow(
      'has no route points',
    );
  });

  it('uses an explicitly loaded client-side network', async () => {
    setLoadedSumoNetwork('custom.net.xml', NET_XML);
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(resolveSumoNetwork('Town01.net.xml')).resolves.toEqual({
      filename: 'Town01.net.xml',
      content: NET_XML,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('loads a colocated network when the client did not upload one', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => NET_XML,
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(resolveSumoNetwork('Town01.net.xml')).resolves.toEqual({
      filename: 'Town01.net.xml',
      content: NET_XML,
    });
    expect(fetchMock).toHaveBeenCalledWith('./Town01.net.xml');
  });
});
