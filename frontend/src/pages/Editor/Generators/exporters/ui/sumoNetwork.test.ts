import { readFileSync } from 'fs';
import { resolve } from 'path';
import process from 'process';

import { afterEach, describe, expect, it, vi } from 'vitest';

import type {
  Car,
  Point,
} from '../../../../../store/types/useEditorStoreTypes';
import {
  buildSumoRoutes,
  clearLoadedSumoNetwork,
  resolveSumoNetwork,
  setLoadedSumoNetwork,
  getSumoCoordinateOffsets,
  isSumoNetXml,
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

  it('validates departPos is non-negative', () => {
    expect(() =>
      buildSumoRoutes(
        NET_XML,
        [
          {
            ...car,
            sumo_edges: 'edge-a edge-b',
            sumo_depart_pos: -1,
          },
        ],
        [],
      ),
    ).toThrow('departPos must be a non-negative number');
  });

  it('validates departPos is within edge length', () => {
    expect(() =>
      buildSumoRoutes(
        NET_XML,
        [
          {
            ...car,
            sumo_edges: 'edge-a edge-b',
            sumo_depart_pos: 100,
          },
        ],
        [],
      ),
    ).toThrow('departPos 100 is outside edge edge-a (length 10.00)');
  });

  it('validates static stop lane exists', () => {
    expect(() =>
      buildSumoRoutes(
        NET_XML,
        [
          {
            ...car,
            sumo_edges: 'edge-a edge-b',
            sumo_stop: {
              lane: 'non-existent',
              startPos: 1,
              endPos: 2,
              duration: 10,
            },
          },
        ],
        [],
      ),
    ).toThrow('stop lane "non-existent" is not a passenger driving lane');
  });

  it('validates static stop is on the route', () => {
    expect(() =>
      buildSumoRoutes(
        NET_XML,
        [
          {
            ...car,
            sumo_edges: 'edge-a edge-b',
            sumo_stop: {
              lane: 'edge-c_0',
              startPos: 1,
              endPos: 2,
              duration: 10,
            },
          },
        ],
        [],
      ),
    ).toThrow('stop lane "edge-c_0" is not part of its route');
  });

  it('validates static stop positions are valid', () => {
    expect(() =>
      buildSumoRoutes(
        NET_XML,
        [
          {
            ...car,
            sumo_edges: 'edge-a edge-b',
            sumo_stop: {
              lane: 'edge-a_0',
              startPos: -1,
              endPos: 2,
              duration: 10,
            },
          },
        ],
        [],
      ),
    ).toThrow('stop positions must satisfy 0 <= startPos < endPos <= 10.00');
  });

  it('validates static stop duration is non-negative', () => {
    expect(() =>
      buildSumoRoutes(
        NET_XML,
        [
          {
            ...car,
            sumo_edges: 'edge-a edge-b',
            sumo_stop: {
              lane: 'edge-a_0',
              startPos: 1,
              endPos: 2,
              duration: -5,
            },
          },
        ],
        [],
      ),
    ).toThrow('stop duration must be a non-negative number');
  });

  it('validates stop is not behind depart position on same edge', () => {
    expect(() =>
      buildSumoRoutes(
        NET_XML,
        [
          {
            ...car,
            sumo_edges: 'edge-a edge-b',
            sumo_depart_pos: 5,
            sumo_stop: {
              lane: 'edge-a_0',
              startPos: 1,
              endPos: 2,
              duration: 10,
            },
          },
        ],
        [],
      ),
    ).toThrow('stop on edge-a_0 is behind departPos 5');
  });

  it('handles unsupported departLane keyword', () => {
    expect(() =>
      buildSumoRoutes(
        NET_XML,
        [
          {
            ...car,
            sumo_edges: 'edge-a edge-b',
            sumo_depart_lane: 'unsupported',
          },
        ],
        [],
      ),
    ).toThrow('unsupported SUMO departLane "unsupported"');
  });

  it('handles invalid departPos type', () => {
    expect(() =>
      buildSumoRoutes(
        NET_XML,
        [
          {
            ...car,
            sumo_edges: 'edge-a edge-b',
            sumo_depart_pos: Infinity,
          },
        ],
        [],
      ),
    ).toThrow('departPos must be a non-negative number');
  });

  it('handles edge with no passenger lanes', () => {
    const network = `<?xml version="1.0" encoding="UTF-8"?>
<net>
  <location netOffset="0,0"/>
  <edge id="edge-a">
    <lane id="edge-a_0" index="0" length="10" shape="0,0 10,0" disallow="passenger"/>
  </edge>
</net>`;
    const localCar = { ...car, x: 2, y: 0, sumo_edges: 'edge-a' };
    const localDestination = { ...destination, x: 8, y: 0 };

    expect(() =>
      buildSumoRoutes(network, [localCar], [localDestination]),
    ).toThrow('SUMO network contains no passenger vehicle edges');
  });

  it('handles invalid XML in parseNetwork', () => {
    const invalidXml = 'not valid xml';
    const localCar = { ...car, x: 2, y: 0 };
    const localDestination = { ...destination, x: 8, y: 0 };

    expect(() =>
      buildSumoRoutes(invalidXml, [localCar], [localDestination]),
    ).toThrow('SUMO network contains invalid XML');
  });

  it('handles invalid netOffset in parseNetwork', () => {
    const network = `<?xml version="1.0" encoding="UTF-8"?>
<net>
  <location netOffset="invalid,200"/>
  <edge id="edge-a">
    <lane id="edge-a_0" index="0" length="10" shape="0,0 10,0"/>
  </edge>
</net>`;
    const localCar = { ...car, x: 2, y: 0 };
    const localDestination = { ...destination, x: 8, y: 0 };

    expect(() =>
      buildSumoRoutes(network, [localCar], [localDestination]),
    ).toThrow('Invalid SUMO coordinate pair: invalid,200');
  });

  it('handles network with no passenger lanes', () => {
    const network = `<?xml version="1.0" encoding="UTF-8"?>
<net>
  <location netOffset="0,0"/>
  <edge id="edge-a">
    <lane id="edge-a_0" index="0" length="10" shape="0,0 10,0" disallow="all"/>
  </edge>
</net>`;
    const localCar = { ...car, x: 2, y: 0 };
    const localDestination = { ...destination, x: 8, y: 0 };

    expect(() =>
      buildSumoRoutes(network, [localCar], [localDestination]),
    ).toThrow('SUMO network contains no passenger vehicle edges');
  });

  it('handles isSumoNetXml with invalid content', () => {
    expect(isSumoNetXml('not xml')).toBe(false);
  });

  it('handles getSumoCoordinateOffsets with invalid XML', () => {
    expect(() => getSumoCoordinateOffsets('not xml')).toThrow(
      'SUMO network contains invalid XML',
    );
  });

  it('handles getSumoCoordinateOffsets with missing netOffset', () => {
    const network = `<?xml version="1.0" encoding="UTF-8"?>
<net>
  <location/>
  <edge id="edge-a">
    <lane id="edge-a_0" index="0" length="10" shape="0,0 10,0"/>
  </edge>
</net>`;
    expect(getSumoCoordinateOffsets(network)).toEqual({ x: 0, y: 0 });
  });

  it('handles resolveSumoNetwork with failed fetch', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(resolveSumoNetwork('Town01.net.xml')).rejects.toThrow(
      'SUMO network Town01.net.xml is unavailable; load it in SUMO settings',
    );
  });
  it('covers lines 155-170: handles manual edges with no route points and valid depart', () => {
    const localCar = {
      ...car,
      sumo_edges: 'edge-a edge-b',
    };

    const routes = buildSumoRoutes(NET_XML, [localCar], []);

    expect(routes['car-1']).toMatchObject({
      edges: 'edge-a edge-b',
      depart: expect.objectContaining({
        edgeId: 'edge-a',
        laneId: 'edge-a_0',
        laneIndex: 0,
      }),
      warnings: [],
    });
  });

  it('covers lines 155-170: throws error when manual edges provided but first edge does not contain spawn', () => {
    const localCar = {
      ...car,
      sumo_edges: 'edge-c',
    };

    expect(() => buildSumoRoutes(NET_XML, [localCar], [destination])).toThrow(
      'scene spawn is not on the first manual SUMO edge edge-c',
    );
  });

  it('covers lines 155-170: throws error when no route points and no manual edges', () => {
    const localCar = { ...car };

    expect(() => buildSumoRoutes(NET_XML, [localCar], [])).toThrow(
      'has no route points',
    );
  });

  it('covers lines 155-170: manual edges with depart lane keyword "best"', () => {
    const localCar = {
      ...car,
      sumo_edges: 'edge-a edge-b',
      sumo_depart_lane: 'best',
      sumo_depart_pos: 2,
    };

    const routes = buildSumoRoutes(NET_XML, [localCar], []);

    expect(routes['car-1'].edges).toBe('edge-a edge-b');
    expect(routes['car-1'].depart).toBeDefined();
  });

  it('covers lines 155-170: manual edges with depart lane keyword "free"', () => {
    const localCar = {
      ...car,
      sumo_edges: 'edge-a edge-b',
      sumo_depart_lane: 'free',
      sumo_depart_pos: 3,
    };

    const routes = buildSumoRoutes(NET_XML, [localCar], []);

    expect(routes['car-1'].edges).toBe('edge-a edge-b');
    expect(routes['car-1'].depart).toBeDefined();
  });

  it('covers lines 155-170: manual edges with depart lane keyword "first"', () => {
    const localCar = {
      ...car,
      sumo_edges: 'edge-a edge-b',
      sumo_depart_lane: 'first',
      sumo_depart_pos: 1,
    };

    const routes = buildSumoRoutes(NET_XML, [localCar], []);

    expect(routes['car-1'].edges).toBe('edge-a edge-b');
    expect(routes['car-1'].depart).toBeDefined();
  });

  it('covers lines 155-170: manual edges with depart lane keyword "random"', () => {
    const localCar = {
      ...car,
      sumo_edges: 'edge-a edge-b',
      sumo_depart_lane: 'random',
      sumo_depart_pos: 4,
    };

    const routes = buildSumoRoutes(NET_XML, [localCar], []);

    expect(routes['car-1'].edges).toBe('edge-a edge-b');
    expect(routes['car-1'].depart).toBeDefined();
  });

  it('covers lines 155-170: manual edges with static stop on route', () => {
    const localCar = {
      ...car,
      sumo_edges: 'edge-a edge-b',
      sumo_stop: {
        lane: 'edge-a_0',
        startPos: 2,
        endPos: 3,
        duration: 10,
      },
    };

    const routes = buildSumoRoutes(NET_XML, [localCar], []);

    expect(routes['car-1'].edges).toBe('edge-a edge-b');
    expect(routes['car-1'].warnings).toEqual([]);
  });

  it('covers lines 155-170: rejects manual edges with invalid depart lane index', () => {
    const localCar = {
      ...car,
      sumo_edges: 'edge-a',
      sumo_depart_lane: '5',
    };

    expect(() => buildSumoRoutes(NET_XML, [localCar], [])).toThrow(
      'departLane 5 is not a passenger driving lane on edge edge-a',
    );
  });

  it('covers lines 155-170: rejects manual edges with non-driving lane type', () => {
    const network = `<?xml version="1.0" encoding="UTF-8"?>
<net>
  <location netOffset="0,0"/>
  <edge id="edge-a">
    <lane id="edge-a_0" index="0" type="sidewalk" length="10" shape="0,0 10,0"/>
  </edge>
</net>`;
    const localCar = {
      ...car,
      x: 2,
      y: 0,
      sumo_edges: 'edge-a',
    };

    expect(() => buildSumoRoutes(network, [localCar], [])).toThrow(
      'its scene spawn is not on the first manual SUMO edge edge-a',
    );
  });

  it('covers lines 155-170: multiple cars with manual edges and no points', () => {
    const car1 = { ...car, id: 'car-1', sumo_edges: 'edge-a edge-b' };
    const car2 = { ...car, id: 'car-2', sumo_edges: 'edge-b edge-c' };

    const routes = buildSumoRoutes(NET_XML, [car1, car2], []);

    expect(routes['car-1'].edges).toBe('edge-a edge-b');
    expect(routes['car-2'].edges).toBe('edge-b edge-c');
    expect(routes['car-1'].depart).toBeDefined();
    expect(routes['car-2'].depart).toBeDefined();
  });
});
