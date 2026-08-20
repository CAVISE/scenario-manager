import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  setCanvasReference,
  invalidatePreviewCache,
  generatePreviewSync,
  generatePreviewAsync,
  buildScenarioPayload,
} from './scenario.load.handler';
import { ScenarioGroup } from '@/api/types/IScenarioTypes';

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

vi.mock('@/store', () => ({
  useEditorStore: {
    getState: () => storeState,
  },
}));

vi.mock(
  '@editor/hooks/useThreeScene/hooks/useOdrLoader/utils/xodrRepository',
  () => ({
    DEFAULT_XODR: 'data.xodr',
    getCachedXodrContent: vi.fn(() => 'cached-xodr-text'),
  })
);

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

describe('scenario.load.handler (sync preview)', () => {
  beforeEach(() => {
    resetStoreState();
    setCanvasReference(null);
    invalidatePreviewCache();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('generatePreviewSync', () => {
    it('returns null when no canvas is registered', () => {
      setCanvasReference(null);
      const result = generatePreviewSync();
      expect(result).toBeNull();
    });

    it('captures a data URL from the registered canvas', () => {
      const canvas = document.createElement('canvas');
      canvas.toDataURL = vi.fn(() => 'data:image/png;base64,SYNC_PREVIEW');
      setCanvasReference(canvas);

      const result = generatePreviewSync();

      expect(result).toBe('data:image/png;base64,SYNC_PREVIEW');
      expect(canvas.toDataURL).toHaveBeenCalledTimes(1);
    });

    it('returns cached preview on subsequent calls without recapturing', () => {
      const canvas = document.createElement('canvas');
      const toDataURL = vi.fn(() => 'data:image/png;base64,CACHED');
      canvas.toDataURL = toDataURL;
      setCanvasReference(canvas);

      const first = generatePreviewSync();
      const second = generatePreviewSync();

      expect(first).toBe('data:image/png;base64,CACHED');
      expect(second).toBe('data:image/png;base64,CACHED');
      expect(toDataURL).toHaveBeenCalledTimes(1);
    });

    it('returns null and logs warning when capture fails', () => {
      const canvas = document.createElement('canvas');
      canvas.toDataURL = vi.fn(() => {
        throw new Error('Canvas tainted');
      });
      setCanvasReference(canvas);

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = generatePreviewSync();

      expect(result).toBeNull();
      expect(warnSpy).toHaveBeenCalledWith(
        'Failed to capture preview:',
        expect.any(Error)
      );

      warnSpy.mockRestore();
    });

    it('returns null when canvas.toDataURL returns empty string', () => {
      const canvas = document.createElement('canvas');
      canvas.toDataURL = vi.fn(() => '');
      setCanvasReference(canvas);

      const result = generatePreviewSync();

      expect(result).toBeNull();
    });
  });

  describe('generatePreviewAsync', () => {
    it('resolves with cached preview immediately', async () => {
      const canvas = document.createElement('canvas');
      canvas.toDataURL = vi.fn(() => 'data:image/png;base64,ASYNC');
      setCanvasReference(canvas);

      generatePreviewSync();

      const result = await generatePreviewAsync();

      expect(result).toBe('data:image/png;base64,ASYNC');
      expect(canvas.toDataURL).toHaveBeenCalledTimes(1);
    });

    it('generates preview when no cache exists', async () => {
      const canvas = document.createElement('canvas');
      canvas.toDataURL = vi.fn(() => 'data:image/png;base64,ASYNC_NEW');
      setCanvasReference(canvas);

      vi.useFakeTimers();

      const promise = generatePreviewAsync();
      await vi.advanceTimersByTimeAsync(20);

      const result = await promise;

      expect(result).toBe('data:image/png;base64,ASYNC_NEW');
    });
  });

  describe('buildScenarioPayload (with sync preview)', () => {
    it('includes preview when canvas is set', () => {
      const canvas = document.createElement('canvas');
      canvas.toDataURL = vi.fn(() => 'data:image/png;base64,PAYLOAD_PREVIEW');
      setCanvasReference(canvas);

      const payload = buildScenarioPayload();

      expect(payload.preview).toBe('data:image/png;base64,PAYLOAD_PREVIEW');
    });

    it('returns null preview when no canvas is set', () => {
      setCanvasReference(null);

      const payload = buildScenarioPayload();

      expect(payload.preview).toBeNull();
    });

    it('includes all scenario data correctly', () => {
      const payload = buildScenarioPayload();

      expect(payload.scenario_id).toBe('sc-1');
      expect(payload.name_of_scenario).toBe('My Scenario');
      expect(payload.description).toBe('A test scenario');
      expect(payload.map).toBe('data.xodr');
      expect(payload.file_).toBe('cached-xodr-text');
    });

    it('uses CARLA map when configured', () => {
      storeState.simConfig = { carla: { map: 'Town05' } };

      const payload = buildScenarioPayload();

      expect(payload.map).toBe('Town05');
    });

    it('returns null id/name when no scenario is set', () => {
      storeState.Scenario = { id: '', name: '', weather: '' };

      const payload = buildScenarioPayload();

      expect(payload.scenario_id).toBeNull();
      expect(payload.name_of_scenario).toBeNull();
      expect(payload.description).toBeNull();
    });

    it('includes car data when present', () => {
      storeState.cars = [
        {
          id: 'car-1',
          x: 10,
          y: 20,
          z: 30,
          color: 'ff0000',
          model: 'vehicle.tesla.model3',
          scale: 1,
          rotation: 0,
        },
      ];

      const payload = buildScenarioPayload();

      expect(payload.scenario).toHaveLength(1);
      const scenario = payload.scenario as ScenarioGroup[];
      const carGroup = scenario.find((g) => g.vehicle === 'car')!;
      expect(carGroup.vehicle).toBe('car');
      expect(carGroup.path).toHaveLength(1);
      const car = carGroup.path[0] as unknown as Record<string, unknown>;
      expect(car.x).toBe(10);
      expect(car.y).toBe(20);
      expect(car.z).toBe(30);
      expect(car.color).toBe(0xff0000);
    });

    it('handles rotation conversion correctly', () => {
      storeState.cars = [
        {
          id: 'car-1',
          x: 0,
          y: 0,
          z: 0,
          color: '00ff00',
          model: 'vehicle.tesla.model3',
          scale: 1,
          rotation: Math.PI / 2,
        },
      ];

      const payload = buildScenarioPayload();
      const scenario = payload.scenario as ScenarioGroup[];
      const carGroup = scenario.find((g) => g.vehicle === 'car')!;
      const car = carGroup.path[0] as unknown as Record<string, unknown>;

      expect(car.rotation).toBe(Math.floor((Math.PI / 2) * 57.32));
    });

    it('marks selected car correctly', () => {
      storeState.selectedId = 'car-1';
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
        {
          id: 'car-2',
          x: 0,
          y: 0,
          z: 0,
          color: 'ff0000',
          model: 'vehicle.audi.a2',
          scale: 1,
          rotation: 0,
        },
      ];

      const payload = buildScenarioPayload();
      const scenario = payload.scenario as ScenarioGroup[];
      const carGroup = scenario.find((g) => g.vehicle === 'car')!;
      const cars = carGroup.path as unknown as Record<string, unknown>;
      expect((cars[0] as Record<string, unknown>).selected).toBe(true);
      expect((cars[1] as Record<string, unknown>).selected).toBe(false);
    });

    it('excludes empty vehicle groups', () => {
      const payload = buildScenarioPayload();
      expect(payload.scenario).toEqual([]);
    });
  });

  describe('setCanvasReference and invalidatePreviewCache', () => {
    it('setCanvasReference clears cached preview', () => {
      const canvas = document.createElement('canvas');
      const toDataURL = vi.fn(() => 'data:image/png;base64,OLD');
      canvas.toDataURL = toDataURL;
      setCanvasReference(canvas);
      expect(generatePreviewSync()).toBe('data:image/png;base64,OLD');
      setCanvasReference(canvas);
      expect(generatePreviewSync()).toBe('data:image/png;base64,OLD');
      expect(toDataURL).toHaveBeenCalledTimes(2); // ✅ Теперь 2 вызова
    });

    it('invalidatePreviewCache forces fresh capture', () => {
      const canvas = document.createElement('canvas');
      const toDataURL = vi
        .fn()
        .mockReturnValueOnce('data:image/png;base64,ONE')
        .mockReturnValueOnce('data:image/png;base64,TWO');
      canvas.toDataURL = toDataURL;
      setCanvasReference(canvas);

      expect(generatePreviewSync()).toBe('data:image/png;base64,ONE');

      invalidatePreviewCache();

      expect(generatePreviewSync()).toBe('data:image/png;base64,TWO');
      expect(toDataURL).toHaveBeenCalledTimes(2);
    });
  });
});
