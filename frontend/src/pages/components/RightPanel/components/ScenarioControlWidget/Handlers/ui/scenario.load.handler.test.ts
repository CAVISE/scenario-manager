import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const storeState = {
  Scenario: {
    id: 'sc-1',
    name: 'My Scenario',
    weather: 'ClearNoon',
    description: 'A test scenario',
  } as Record<string, unknown>,
  simConfig: undefined as unknown,
  selectedId: '',
  cars: [] as Array<Record<string, unknown> & { id: string }>,
  points: [] as Array<Record<string, unknown> & { carId?: string }>,
  lidars: [] as Array<Record<string, unknown> & { carId?: string }>,
  RSUs: [] as Array<Record<string, unknown> & { id: string }>,
  buildings: [] as Array<Record<string, unknown> & { id: string }>,
  pedestrians: [] as Array<Record<string, unknown> & { id: string }>,
};

vi.mock('../../../../../../../store', () => ({
  useEditorStore: {
    getState: () => storeState,
  },
}));

const { getCachedXodrContentMock } = vi.hoisted(() => ({
  getCachedXodrContentMock: vi.fn(() => 'cached-xodr-text'),
}));

vi.mock(
  '../../../../../../Editor/hooks/useThreeScene/hooks/useOdrLoader/utils/xodrRepository',
  () => ({
    DEFAULT_XODR: 'data.xodr',
    getCachedXodrContent: getCachedXodrContentMock,
  }),
);

import {
  setCanvasReference,
  invalidatePreviewCache,
  generatePreviewAsync,
  buildScenarioPayload,
} from './scenario.load.handler';
import { ScenarioGroup } from '../../../../../../../api/types/IScenarioTypes';

const resetStoreState = () => {
  storeState.Scenario = {
    id: 'sc-1',
    name: 'My Scenario',
    weather: 'ClearNoon',
    description: 'A test scenario',
  };
  storeState.simConfig = undefined;
  storeState.selectedId = '';
  storeState.cars = [];
  storeState.points = [];
  storeState.lidars = [];
  storeState.RSUs = [];
  storeState.buildings = [];
  storeState.pedestrians = [];
};

describe('scenario.load.handler', () => {
  beforeEach(() => {
    resetStoreState();
    getCachedXodrContentMock.mockClear();
    getCachedXodrContentMock.mockReturnValue('cached-xodr-text');

    setCanvasReference(null);
    invalidatePreviewCache();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('buildScenarioPayload', () => {
    it('maps scenario metadata and falls back to the default map', () => {
      const payload = buildScenarioPayload();

      expect(payload.scenario_id).toBe('sc-1');
      expect(payload.name_of_scenario).toBe('My Scenario');
      expect(payload.description).toBe('A test scenario');
      expect(payload.weather).toBe('ClearNoon');
      expect(payload.map).toBe('data.xodr');
      expect(payload.file_).toBe('cached-xodr-text');
      expect(payload.preview).toBeNull();
    });

    it('uses the configured CARLA map over the default when present', () => {
      storeState.simConfig = { carla: { map: 'Town05' } };

      const payload = buildScenarioPayload();

      expect(payload.map).toBe('Town05');
    });

    it('falls back to null id/name/description when no scenario is set', () => {
      storeState.Scenario = { id: '', name: '', weather: '' };

      const payload = buildScenarioPayload();

      expect(payload.scenario_id).toBeNull();
      expect(payload.name_of_scenario).toBeNull();
      expect(payload.description).toBeNull();
    });

    it('omits empty vehicle groups from the scenario array', () => {
      const payload = buildScenarioPayload();

      expect(payload.scenario).toEqual([]);
    });

    it('includes only the groups that have entries, each correctly shaped', () => {
      storeState.selectedId = 'car-1';
      storeState.cars = [
        {
          id: 'car-1',
          x: 1,
          y: 2,
          z: 3,
          color: 'ff0000',
          model: 'vehicle.tesla.model3',
          scale: 1,
          rotation: Math.PI / 2,
          opencda_max_speed: 40,
          opencda_v2x: { enabled: true, communication_range: 50 },
        },
      ];
      storeState.points = [
        { id: 'p1', carId: 'car-1', x: 5, y: 6, z: 0 },
        { id: 'p2', carId: 'other-car', x: 9, y: 9, z: 0 },
      ];
      storeState.lidars = [
        {
          id: 'l1',
          carId: 'car-1',
          x: 0,
          y: 0,
          z: 1,
          rotation: 0,
          range: 50,
          channels: 32,
          rotation_frequency: 20,
        },
      ];
      storeState.RSUs = [{ id: 'rsu-1', x: 10, y: 10, z: 0 }];
      storeState.buildings = [
        { id: 'b1', x: 1, y: 1, z: 0, height: 10, material: 'concrete' },
      ];
      storeState.pedestrians = [{ id: 'ped-1', x: 2, y: 2, z: 0, speed: 1.4 }];

      const payload = buildScenarioPayload();
      const scenario = payload.scenario as ScenarioGroup[];
      const carGroup = scenario.find((g) => g.vehicle === 'car');
      const rsuGroup = scenario.find((g) => g.vehicle === 'RSU');
      const buildingGroup = scenario.find((g) => g.vehicle === 'building');
      const pedestrianGroup = scenario.find((g) => g.vehicle === 'pedestrian');

      expect(payload.scenario).toHaveLength(4);

      const car = carGroup?.path[0] as unknown as Record<string, unknown>;
      expect(car.color).toBe(0xff0000);
      expect(car.rotation).toBe(Math.floor((Math.PI / 2) * 57.32));
      expect(car.selected).toBe(true);
      expect(car.points).toEqual([{ id: 0, x: 5, y: 6, z: 0 }]);
      expect(car.lidars).toEqual([
        {
          x: 0,
          y: 0,
          z: 1,
          rotation: 0,
          range: 50,
          channels: 32,
          rotation_frequency: 20,
        },
      ]);
      expect(car.opencda_v2x_enabled).toBe(true);
      expect(car.opencda_v2x_communication_range).toBe(50);

      expect(rsuGroup?.path).toHaveLength(1);
      expect(buildingGroup?.path).toHaveLength(1);
      expect(pedestrianGroup?.path).toHaveLength(1);
    });

    it('marks no car as selected when selectedId matches nothing', () => {
      storeState.selectedId = 'not-a-real-id';
      storeState.cars = [
        {
          id: 'car-1',
          x: 0,
          y: 0,
          z: 0,
          color: '00ff00',
          model: 'vehicle.tesla.model3',
          scale: 1,
          rotation: 0,
        },
      ];

      const payload = buildScenarioPayload();
      const scenario = payload.scenario as ScenarioGroup[];
      const car = scenario[0].path[0] as unknown as Record<string, unknown>;

      expect(car.selected).toBe(false);
    });

    it('passes through every optional OpenCDA/SUMO car field when present', () => {
      storeState.cars = [
        {
          id: 'car-1',
          x: 0,
          y: 0,
          z: 0,
          color: 'ffffff',
          model: 'vehicle.tesla.model3',
          scale: 1,
          rotation: 0,
          opencda_ignore_traffic_light: true,
          opencda_overtake_allowed: false,
          opencda_collision_time_ahead: 2.5,
          opencda_local_planner_debug: true,
          opencda_local_planner_debug_trajectory: false,
          opencda_carla_model: 'vehicle.audi.a2',
          opencda_color: [10, 20, 30],
          sumo_depart: '0',
          sumo_depart_lane: 'best',
          sumo_depart_pos: 'random',
          sumo_max_speed: 30,
          sumo_edges: ['e1', 'e2'],
          sumo_vtype: 'passenger',
          sumo_stop: { lane: 'e1_0', startPos: 1, endPos: 2, duration: 10 },
        },
      ];

      const payload = buildScenarioPayload();
      const scenario = payload.scenario as ScenarioGroup[];
      const car = scenario[0].path[0] as unknown as Record<string, unknown>;

      expect(car.opencda_ignore_traffic_light).toBe(true);
      expect(car.opencda_overtake_allowed).toBe(false);
      expect(car.opencda_collision_time_ahead).toBe(2.5);
      expect(car.opencda_local_planner_debug).toBe(true);
      expect(car.opencda_local_planner_debug_trajectory).toBe(false);
      expect(car.opencda_carla_model).toBe('vehicle.audi.a2');
      expect(car.opencda_color).toEqual([10, 20, 30]);
      expect(car.sumo_depart).toBe('0');
      expect(car.sumo_depart_lane).toBe('best');
      expect(car.sumo_depart_pos).toBe('random');
      expect(car.sumo_max_speed).toBe(30);
      expect(car.sumo_edges).toEqual(['e1', 'e2']);
      expect(car.sumo_vtype).toBe('passenger');
      expect(car.sumo_stop).toEqual({
        lane: 'e1_0',
        startPos: 1,
        endPos: 2,
        duration: 10,
      });
    });

    it('passes through every optional field of an RSU, including all opencda_sensing sub-fields', () => {
      storeState.RSUs = [
        {
          id: 'rsu-1',
          x: 10,
          y: 10,
          z: 0,
          scenario: 'aim-check',
          opencda_name: 'RSU North',
          opencda_id: 5,
          opencda_color: [1, 2, 3],
          opencda_behavior_services: ['collision_alert'],
          opencda_sensing: {
            perception_activate: true,
            detection_range: 100,
            camera_visualize: 1,
            camera_num: 2,
            camera_positions: [[0, 0, 0, 0]],
            lidar_visualize: true,
            lidar_channels: 32,
            lidar_range: 50,
            lidar_points_per_second: 100000,
            lidar_rotation_frequency: 20,
            lidar_upper_fov: 10,
            lidar_lower_fov: -30,
            lidar_dropoff_general_rate: 0.1,
            lidar_dropoff_intensity_limit: 0.5,
            lidar_dropoff_zero_intensity: 0.2,
            lidar_noise_stddev: 0.01,
            localization_activate: true,
            gnss_noise_alt_stddev: 0.1,
            gnss_noise_lat_stddev: 0.2,
            gnss_noise_lon_stddev: 0.3,
          },
        },
      ];

      const payload = buildScenarioPayload();
      const scenario = payload.scenario as ScenarioGroup[];
      const rsuGroup = scenario.find((g) => g.vehicle === 'RSU');
      const rsu = rsuGroup?.path[0] as unknown as Record<string, unknown>;

      expect(rsu.scenario).toBe('aim-check');
      expect(rsu.opencda_name).toBe('RSU North');
      expect(rsu.opencda_id).toBe(5);
      expect(rsu.opencda_color).toEqual([1, 2, 3]);
      expect(rsu.opencda_behavior_services).toEqual(['collision_alert']);
      expect(rsu.opencda_perception_activate).toBe(true);
      expect(rsu.opencda_detection_range).toBe(100);
      expect(rsu.opencda_camera_visualize).toBe(1);
      expect(rsu.opencda_camera_num).toBe(2);
      expect(rsu.opencda_camera_positions).toEqual([[0, 0, 0, 0]]);
      expect(rsu.opencda_lidar_visualize).toBe(true);
      expect(rsu.opencda_lidar_channels).toBe(32);
      expect(rsu.opencda_lidar_range).toBe(50);
      expect(rsu.opencda_lidar_points_per_second).toBe(100000);
      expect(rsu.opencda_lidar_rotation_frequency).toBe(20);
      expect(rsu.opencda_lidar_upper_fov).toBe(10);
      expect(rsu.opencda_lidar_lower_fov).toBe(-30);
      expect(rsu.opencda_lidar_dropoff_general_rate).toBe(0.1);
      expect(rsu.opencda_lidar_dropoff_intensity_limit).toBe(0.5);
      expect(rsu.opencda_lidar_dropoff_zero_intensity).toBe(0.2);
      expect(rsu.opencda_lidar_noise_stddev).toBe(0.01);
      expect(rsu.opencda_localization_activate).toBe(true);
      expect(rsu.opencda_gnss_noise_alt_stddev).toBe(0.1);
      expect(rsu.opencda_gnss_noise_lat_stddev).toBe(0.2);
      expect(rsu.opencda_gnss_noise_lon_stddev).toBe(0.3);
    });

    it('falls back to null scenario and leaves opencda_sensing fields undefined when an RSU has none of these fields set', () => {
      storeState.RSUs = [{ id: 'rsu-1', x: 0, y: 0, z: 0 }];

      const payload = buildScenarioPayload();
      const scenario = payload.scenario as ScenarioGroup[];
      const rsuGroup = scenario.find((g) => g.vehicle === 'RSU');
      const rsu = rsuGroup?.path[0] as unknown as Record<string, unknown>;

      expect(rsu.scenario).toBeNull();
      expect(rsu.opencda_name).toBeUndefined();
      expect(rsu.opencda_perception_activate).toBeUndefined();
      expect(rsu.opencda_gnss_noise_lon_stddev).toBeUndefined();
    });

    it('passes through every field of a pedestrian', () => {
      storeState.pedestrians = [
        {
          id: 'ped-1',
          x: 2,
          y: 3,
          z: 0,
          speed: 1.4,
          cross_factor: 0.5,
          is_invincible: false,
          tx_power: 20,
          frequency: 5.9e9,
          protocol: 'DSRC',
          beacon_interval: 100,
        },
      ];

      const payload = buildScenarioPayload();
      const scenario = payload.scenario as ScenarioGroup[];
      const pedestrianGroup = scenario.find((g) => g.vehicle === 'pedestrian');
      const ped = pedestrianGroup?.path[0] as unknown as Record<
        string,
        unknown
      >;

      expect(ped).toEqual({
        id: 'ped-1',
        x: 2,
        y: 3,
        z: 0,
        speed: 1.4,
        cross_factor: 0.5,
        is_invincible: false,
        tx_power: 20,
        frequency: 5.9e9,
        protocol: 'DSRC',
        beacon_interval: 100,
      });
    });
  });

  describe('setCanvasReference / capturePreview / invalidatePreviewCache', () => {
    it('setCanvasReference(null) clears any cached preview', async () => {
      const canvas = document.createElement('canvas');
      canvas.toDataURL = vi.fn(() => 'data:image/png;base64,AAA');
      setCanvasReference(canvas);

      vi.useFakeTimers();
      const first = generatePreviewAsync();
      await vi.advanceTimersByTimeAsync(20);
      expect(await first).toBe('data:image/png;base64,AAA');

      setCanvasReference(null);
      const second = await generatePreviewAsync();
      expect(second).toBeNull();
    });

    it('invalidatePreviewCache forces a fresh capture on the next call', async () => {
      const canvas = document.createElement('canvas');
      const toDataURL = vi
        .fn()
        .mockReturnValueOnce('data:image/png;base64,ONE')
        .mockReturnValueOnce('data:image/png;base64,TWO');
      canvas.toDataURL = toDataURL;
      setCanvasReference(canvas);

      vi.useFakeTimers();
      const firstPromise = generatePreviewAsync();
      await vi.advanceTimersByTimeAsync(20);
      expect(await firstPromise).toBe('data:image/png;base64,ONE');

      const cachedPromise = generatePreviewAsync();
      await vi.advanceTimersByTimeAsync(20);
      expect(await cachedPromise).toBe('data:image/png;base64,ONE');
      expect(toDataURL).toHaveBeenCalledTimes(1);

      invalidatePreviewCache();
      const secondPromise = generatePreviewAsync();
      await vi.advanceTimersByTimeAsync(20);
      expect(await secondPromise).toBe('data:image/png;base64,TWO');
      expect(toDataURL).toHaveBeenCalledTimes(2);
    });
  });

  describe('generatePreviewAsync', () => {
    it('resolves null immediately when no canvas is registered', async () => {
      setCanvasReference(null);

      const result = await generatePreviewAsync();

      expect(result).toBeNull();
    });

    it('captures a data URL from the registered canvas', async () => {
      const canvas = document.createElement('canvas');
      canvas.toDataURL = vi.fn(() => 'data:image/png;base64,XYZ');
      setCanvasReference(canvas);

      vi.useFakeTimers();
      const promise = generatePreviewAsync();
      await vi.advanceTimersByTimeAsync(20);

      expect(await promise).toBe('data:image/png;base64,XYZ');
    });

    it('queues concurrent calls behind the in-flight capture and resolves them all with the same result', async () => {
      const canvas = document.createElement('canvas');
      const toDataURL = vi.fn(() => 'data:image/png;base64,SHARED');
      canvas.toDataURL = toDataURL;
      setCanvasReference(canvas);

      vi.useFakeTimers();

      const first = generatePreviewAsync();
      const second = generatePreviewAsync();
      const third = generatePreviewAsync();

      await vi.advanceTimersByTimeAsync(20);

      const [r1, r2, r3] = await Promise.all([first, second, third]);

      expect(r1).toBe('data:image/png;base64,SHARED');
      expect(r2).toBe('data:image/png;base64,SHARED');
      expect(r3).toBe('data:image/png;base64,SHARED');
      expect(toDataURL).toHaveBeenCalledTimes(1);
    });

    it('returns the cached preview on a later call without recapturing', async () => {
      const canvas = document.createElement('canvas');
      const toDataURL = vi.fn(() => 'data:image/png;base64,CACHED');
      canvas.toDataURL = toDataURL;
      setCanvasReference(canvas);

      vi.useFakeTimers();
      const first = generatePreviewAsync();
      await vi.advanceTimersByTimeAsync(20);
      await first;

      const second = await generatePreviewAsync();

      expect(second).toBe('data:image/png;base64,CACHED');
      expect(toDataURL).toHaveBeenCalledTimes(1);
    });

    it('covers catch block: resolves pending callbacks with null when capture fails', async () => {
      const canvas = document.createElement('canvas');
      let callCount = 0;
      canvas.toDataURL = vi.fn(() => {
        callCount++;
        if (callCount === 1) {
          throw new Error('canvas is tainted');
        }
        return 'data:image/png;base64,SUCCESS';
      });
      setCanvasReference(canvas);
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      vi.useFakeTimers();

      const promises = [
        generatePreviewAsync(),
        generatePreviewAsync(),
        generatePreviewAsync(),
      ];

      await vi.advanceTimersByTimeAsync(20);

      const results = await Promise.all(promises);

      expect(results).toEqual([null, null, null]);
      expect(warnSpy).toHaveBeenCalledWith(
        'Failed to capture preview:',
        expect.any(Error),
      );
      expect(canvas.toDataURL).toHaveBeenCalledTimes(1);

      warnSpy.mockRestore();
    });

    it('covers catch block: handles error during preview generation and resolves pending callbacks', async () => {
      const canvas = document.createElement('canvas');
      canvas.toDataURL = vi.fn(() => {
        throw new Error('Unexpected error');
      });
      setCanvasReference(canvas);
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      vi.useFakeTimers();

      const promise = generatePreviewAsync();
      const promise2 = generatePreviewAsync();
      const promise3 = generatePreviewAsync();

      await vi.advanceTimersByTimeAsync(20);

      const [result1, result2, result3] = await Promise.all([
        promise,
        promise2,
        promise3,
      ]);

      expect(result1).toBeNull();
      expect(result2).toBeNull();
      expect(result3).toBeNull();
      expect(warnSpy).toHaveBeenCalledWith(
        'Failed to capture preview:',
        expect.any(Error),
      );

      warnSpy.mockRestore();
    });

    it('covers finally block: resets previewGenerationInProgress after error', async () => {
      const canvas = document.createElement('canvas');
      canvas.toDataURL = vi.fn(() => {
        throw new Error('Test error');
      });
      setCanvasReference(canvas);
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      vi.useFakeTimers();

      const promise = generatePreviewAsync();
      await vi.advanceTimersByTimeAsync(20);
      await promise;

      const secondPromise = generatePreviewAsync();
      await vi.advanceTimersByTimeAsync(20);
      await secondPromise;

      expect(canvas.toDataURL).toHaveBeenCalledTimes(2);
      expect(warnSpy).toHaveBeenCalledTimes(2);

      warnSpy.mockRestore();
    });

    it('covers catch block: handles error and resolves pending callbacks with null', async () => {
      const canvas = document.createElement('canvas');
      let callCount = 0;
      canvas.toDataURL = vi.fn(() => {
        callCount++;
        if (callCount === 1) {
          throw new Error('First call fails');
        }
        return 'data:image/png;base64,SUCCESS';
      });
      setCanvasReference(canvas);
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      vi.useFakeTimers();

      const promise1 = generatePreviewAsync();
      const promise2 = generatePreviewAsync();

      await vi.advanceTimersByTimeAsync(20);

      const result1 = await promise1;
      const result2 = await promise2;

      expect(result1).toBeNull();
      expect(result2).toBeNull();
      expect(warnSpy).toHaveBeenCalledWith(
        'Failed to capture preview:',
        expect.any(Error),
      );
      expect(canvas.toDataURL).toHaveBeenCalledTimes(1);

      const promise3 = generatePreviewAsync();
      await vi.advanceTimersByTimeAsync(20);
      const result3 = await promise3;

      expect(result3).toBe('data:image/png;base64,SUCCESS');

      warnSpy.mockRestore();
    });
  });
});
describe('generatePreviewAsync', () => {
  it('resolves null immediately when no canvas is registered', async () => {
    setCanvasReference(null);
    const result = await generatePreviewAsync();
    expect(result).toBeNull();
  });

  it('captures a data URL from the registered canvas', async () => {
    const canvas = document.createElement('canvas');
    canvas.toDataURL = vi.fn(() => 'data:image/png;base64,XYZ');
    setCanvasReference(canvas);

    vi.useFakeTimers();
    const promise = generatePreviewAsync();
    await vi.advanceTimersByTimeAsync(20);

    expect(await promise).toBe('data:image/png;base64,XYZ');
  });

  it('resolves null and logs a warning when the canvas capture throws', async () => {
    const canvas = document.createElement('canvas');
    canvas.toDataURL = vi.fn(() => {
      throw new Error('canvas is tainted');
    });
    setCanvasReference(canvas);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    vi.useFakeTimers();
    const promise = generatePreviewAsync();
    await vi.advanceTimersByTimeAsync(20);

    expect(await promise).toBeNull();
    expect(warnSpy).toHaveBeenCalledWith(
      'Failed to capture preview:',
      expect.any(Error),
    );

    (canvas.toDataURL as ReturnType<typeof vi.fn>).mockReturnValue(
      'data:image/png;base64,RECOVERED',
    );
    const retryPromise = generatePreviewAsync();
    await vi.advanceTimersByTimeAsync(20);
    expect(await retryPromise).toBe('data:image/png;base64,RECOVERED');

    warnSpy.mockRestore();
  });

  it('resolves all queued concurrent calls with null when the canvas capture throws', async () => {
    const canvas = document.createElement('canvas');
    canvas.toDataURL = vi.fn(() => {
      throw new Error('canvas is tainted');
    });
    setCanvasReference(canvas);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    vi.useFakeTimers();

    const first = generatePreviewAsync();
    const second = generatePreviewAsync();
    const third = generatePreviewAsync();

    await vi.advanceTimersByTimeAsync(20);

    const [r1, r2, r3] = await Promise.all([first, second, third]);

    expect(r1).toBeNull();
    expect(r2).toBeNull();
    expect(r3).toBeNull();

    expect(warnSpy).toHaveBeenCalledWith(
      'Failed to capture preview:',
      expect.any(Error),
    );
    expect(canvas.toDataURL).toHaveBeenCalledTimes(1);

    warnSpy.mockRestore();
  });

  it('queues concurrent calls behind the in-flight capture and resolves them all with the same result', async () => {
    const canvas = document.createElement('canvas');
    const toDataURL = vi.fn(() => 'data:image/png;base64,SHARED');
    canvas.toDataURL = toDataURL;
    setCanvasReference(canvas);

    vi.useFakeTimers();

    const first = generatePreviewAsync();
    const second = generatePreviewAsync();
    const third = generatePreviewAsync();

    await vi.advanceTimersByTimeAsync(20);

    const [r1, r2, r3] = await Promise.all([first, second, third]);

    expect(r1).toBe('data:image/png;base64,SHARED');
    expect(r2).toBe('data:image/png;base64,SHARED');
    expect(r3).toBe('data:image/png;base64,SHARED');
    expect(toDataURL).toHaveBeenCalledTimes(1);
  });

  it('returns the cached preview on a later call without recapturing', async () => {
    const canvas = document.createElement('canvas');
    const toDataURL = vi.fn(() => 'data:image/png;base64,CACHED');
    canvas.toDataURL = toDataURL;
    setCanvasReference(canvas);

    vi.useFakeTimers();
    const first = generatePreviewAsync();
    await vi.advanceTimersByTimeAsync(20);
    await first;

    const second = await generatePreviewAsync();

    expect(second).toBe('data:image/png;base64,CACHED');
    expect(toDataURL).toHaveBeenCalledTimes(1);
  });

  it('covers catch block: resolves pending callbacks with null when capture fails', async () => {
    const canvas = document.createElement('canvas');
    let callCount = 0;
    canvas.toDataURL = vi.fn(() => {
      callCount++;
      if (callCount === 1) {
        throw new Error('canvas is tainted');
      }
      return 'data:image/png;base64,SUCCESS';
    });
    setCanvasReference(canvas);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    vi.useFakeTimers();

    const promises = [
      generatePreviewAsync(),
      generatePreviewAsync(),
      generatePreviewAsync(),
    ];

    await vi.advanceTimersByTimeAsync(20);

    const results = await Promise.all(promises);

    expect(results).toEqual([null, null, null]);
    expect(warnSpy).toHaveBeenCalledWith(
      'Failed to capture preview:',
      expect.any(Error),
    );
    expect(canvas.toDataURL).toHaveBeenCalledTimes(1);

    warnSpy.mockRestore();
  });

  it('covers finally block: resets previewGenerationInProgress after error', async () => {
    const canvas = document.createElement('canvas');
    canvas.toDataURL = vi.fn(() => {
      throw new Error('Test error');
    });
    setCanvasReference(canvas);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    vi.useFakeTimers();

    const promise = generatePreviewAsync();
    await vi.advanceTimersByTimeAsync(20);
    await promise;

    const secondPromise = generatePreviewAsync();
    await vi.advanceTimersByTimeAsync(20);
    await secondPromise;

    expect(canvas.toDataURL).toHaveBeenCalledTimes(2);
    expect(warnSpy).toHaveBeenCalledTimes(2);

    warnSpy.mockRestore();
  });

  it('covers catch block: handles error and resolves pending callbacks with null', async () => {
    const canvas = document.createElement('canvas');
    let callCount = 0;
    canvas.toDataURL = vi.fn(() => {
      callCount++;
      if (callCount === 1) {
        throw new Error('First call fails');
      }
      return 'data:image/png;base64,SUCCESS';
    });
    setCanvasReference(canvas);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    vi.useFakeTimers();

    const promise1 = generatePreviewAsync();
    const promise2 = generatePreviewAsync();

    await vi.advanceTimersByTimeAsync(20);

    const result1 = await promise1;
    const result2 = await promise2;

    expect(result1).toBeNull();
    expect(result2).toBeNull();
    expect(warnSpy).toHaveBeenCalledWith(
      'Failed to capture preview:',
      expect.any(Error),
    );
    expect(canvas.toDataURL).toHaveBeenCalledTimes(1);

    const promise3 = generatePreviewAsync();
    await vi.advanceTimersByTimeAsync(20);
    const result3 = await promise3;

    expect(result3).toBe('data:image/png;base64,SUCCESS');

    warnSpy.mockRestore();
  });
});
