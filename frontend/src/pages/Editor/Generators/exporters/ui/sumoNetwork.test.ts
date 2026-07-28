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
  it('maps CARLA coordinates and fills intermediate SUMO edges', () => {
    expect(buildSumoRoutes(NET_XML, [car], [destination])).toEqual({
      'car-1': 'edge-a edge-b edge-c',
    });
  });

  it('keeps manually configured edges out of automatic routing', () => {
    expect(
      buildSumoRoutes(
        NET_XML,
        [{ ...car, sumo_edges: 'manual-a manual-b' }],
        [],
      ),
    ).toEqual({});
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
