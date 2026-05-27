import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as THREE from 'three';
const { fetchQueryMock, getScenarioMock } = vi.hoisted(() => ({
  fetchQueryMock: vi.fn(),
  getScenarioMock: vi.fn(),
}));

vi.mock('../../../../../../../api/queryClient', () => ({
  queryClient: { fetchQuery: fetchQueryMock },
}));

vi.mock(
  '../../../../../../Editor/hooks/useApiHooks/useScenarioQueries',
  () => ({
    scenarioKeys: { detail: (id: string) => ['scenario', id] },
    useScenarioCreateMutation: () => ({}),
    useScenarioPatchMutation: () => ({}),
    useScenarioPutMutation: () => ({}),
  }),
);
vi.mock('../../../../../../../api/scenarios', () => ({
  scenariosApi: {
    get: getScenarioMock,
    delete: vi.fn().mockResolvedValue({ scenario_id: 'sc-1' }),
  },
}));
vi.mock(
  '../../../../../../Editor/hooks/useApiHooks/useSimulationMutation',
  () => ({
    useStartSimulationMutation: () => ({}),
  }),
);
vi.mock('../../../../../../../api/errors', () => ({
  getApiErrorMessage: vi.fn((_err, fallback) => Promise.resolve(fallback)),
}));
const createStoreState = () => {
  const state = {
    cars: [] as Array<{ id: string }>,
    points: [] as Array<{ id: string; carId?: string }>,
    buildings: [] as Array<{
      id: string;
      x: number;
      y: number;
      z: number;
      rotation?: number;
      scale?: number;
    }>,
    pedestrians: [] as Array<{ id: string }>,
    RSUs: [] as Array<{ id: string }>,
    lidars: [] as Array<{ id: string }>,
    Scenario: { id: '', name: '', weather: '' },
    selectedId: '',
    addCar: vi.fn(() => 'car-1'),
    updateCar: vi.fn(),
    addPoint: vi.fn(),
    addLidar: vi.fn(),
    updateLidar: vi.fn(),
    addRSU: vi.fn(),
    updateRSU: vi.fn(),
    addPedestrian: vi.fn(() => 'ped-1'),
    updatePedestrian: vi.fn((id: string, patch: Record<string, unknown>) => {
      const target = storeState.pedestrians.find((p) => p.id === id);
      if (target) Object.assign(target, patch);
    }),
    addBuilding: vi.fn((x: number, y: number, z: number) => {
      const id = `b-${state.buildings.length + 1}`;
      state.buildings.push({ id, x, y, z });
      return id;
    }),
    updateBuilding: vi.fn((id: string, patch: Record<string, unknown>) => {
      const target = state.buildings.find((b) => b.id === id);
      if (target) Object.assign(target, patch);
    }),
    removeCar: vi.fn(),
    removeRSU: vi.fn(),
    removePoint: vi.fn(),
    removeBuilding: vi.fn(),
    removePedestrian: vi.fn(),
    updateScenario: vi.fn(),
  };
  return state;
};

const storeState = createStoreState();

vi.mock('../../../../../../../store', () => ({
  useEditorStore: { getState: () => storeState },
}));

import {
  handleCreate,
  handleDelete,
  handleLoad,
  handlePatch,
  handleRunSimulation,
} from './scenario.handlers';
import { buildScenarioPayload } from './scenario.load.handler';
import {
  Building,
  Car,
  EditorState,
  Lidar,
  Pedestrian,
  Point,
  RSU,
  Scenario,
} from '../../../../../../../store/types/useEditorStoreTypes';
import { LoadScenarioOptions } from '../types/scenario.load.handlerTypes';
import {
  useScenarioCreateMutation,
  useScenarioPatchMutation,
  useScenarioPutMutation,
} from '../../../../../../Editor/hooks/useApiHooks/useScenarioQueries';
import { useEditorStore } from '../../../../../../../store';
import { useStartSimulationMutation } from '../../../../../../Editor/hooks/useApiHooks/useSimulationMutation';

describe('handleLoad regression', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storeState.cars = [];
    storeState.RSUs = [];
    storeState.points = [];
    storeState.buildings = [];
    storeState.pedestrians = [];
    storeState.lidars = [];
  });

  it('handles all vehicle types: car, pedestrian, RSU', async () => {
    fetchQueryMock.mockResolvedValue({
      scenario: {
        scenario_id: 'full-1',
        scenario_text: [
          {
            vehicle: 'car',
            path: [
              {
                x: 10,
                y: 0,
                z: 10,
                model: 'audi',
                color: 'FF0000',
                points: [{ x: 1, y: 1 }],
              },
            ],
          },
          { vehicle: 'pedestrian', path: [{ x: 5, y: 0, z: 5, speed: 1.5 }] },
          { vehicle: 'RSU', path: [{ x: 20, y: 0, z: 20, frequency: 5.9 }] },
        ],
      },
    });

    const setNotice = vi.fn();

    await handleLoad({
      hasId: true,
      scenarioIdInput: 'full-1',
      sceneRef: {
        current: new THREE.Scene(),
      } as LoadScenarioOptions['sceneRef'],
      setNotice,
      loadRSURef: { current: vi.fn() } as LoadScenarioOptions['loadRSURef'],
      buildingModelRef: {
        current: {},
      } as LoadScenarioOptions['buildingModelRef'],
      updateSceneGraph: vi.fn(),
      loadFile: vi.fn(),
    });

    expect(storeState.addCar).toHaveBeenCalled();
    expect(storeState.addPedestrian).toHaveBeenCalled();
    expect(storeState.addRSU).toHaveBeenCalled();
    expect(setNotice).toHaveBeenCalledWith('The script has been uploaded.');
  });

  it('does not crash when buildingModelRef is missing', async () => {
    vi.useFakeTimers();
    fetchQueryMock.mockResolvedValue({
      scenario: {
        scenario_id: 's1',
        name_of_scenario: 'Scenario 1',
        scenario_text: [
          {
            vehicle: 'building',
            path: [{ x: 1, y: 2, z: 3, height: 10, material: 'concrete' }],
          },
        ],
      },
    });
    getScenarioMock.mockResolvedValue({});

    const setNotice = vi.fn();
    const updateSceneGraph = vi.fn();

    await expect(
      handleLoad({
        hasId: true,
        scenarioIdInput: 's1',
        sceneRef: { current: { children: [], add: vi.fn() } } as never,
        setNotice,
        loadRSURef: { current: vi.fn() } as never,
        buildingModelRef: undefined as never,
        updateSceneGraph,
        loadFile: vi.fn(),
      }),
    ).resolves.toBeUndefined();

    vi.runAllTimers();
    expect(setNotice).toHaveBeenCalledWith('The script has been uploaded.');
    vi.useRealTimers();
  });
});

describe('buildScenarioPayload', () => {
  beforeEach(() => {
    storeState.cars = [];
    storeState.points = [];
    storeState.buildings = [];
    storeState.pedestrians = [];
    storeState.RSUs = [];
    storeState.lidars = [];
    storeState.Scenario = { id: '', name: '', weather: '' };
    storeState.selectedId = '';
    delete (storeState as unknown as { simConfig?: unknown }).simConfig;
  });

  it('uses store values when they are present', () => {
    storeState.Scenario = { id: 'sc-1', name: 'My Scenario', weather: 'Rain' };

    const payload = buildScenarioPayload();

    expect(payload.scenario_id).toBe('sc-1');
    expect(payload.scenario_name).toBe('My Scenario');
    expect(payload.weather).toBe('Rain');
    expect(payload.id).toBe('sc-1');
    expect(payload.name_of_scenario).toBe('My Scenario');
  });

  it('falls back to localStorage when store is empty', () => {
    storeState.Scenario = { id: '', name: '', weather: '' };
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => {
      if (key === 'scenario_name') return 'Stored Name';
      if (key === 'weather') return 'ClearNoon';
      return null;
    });

    const payload = buildScenarioPayload();

    expect(payload.scenario_name).toBe('Stored Name');
    expect(payload.weather).toBe('ClearNoon');

    vi.restoreAllMocks();
  });

  it('sets scenario_id and id to null when id is empty', () => {
    storeState.Scenario = { id: '', name: 'Test', weather: 'Fog' };

    const payload = buildScenarioPayload();

    expect(payload.scenario_id).toBeNull();
    expect(payload.id).toBeNull();
  });

  it('sets name_of_scenario to null when name is empty', () => {
    storeState.Scenario = { id: '', name: '', weather: '' };

    const payload = buildScenarioPayload();

    expect(payload.name_of_scenario).toBeNull();
  });

  it('maps cars with their points and lidars filtered by carId', () => {
    storeState.cars = [
      {
        id: 'car-1',
        x: 1,
        y: 2,
        z: 3,
        model: 'audi',
        color: 'FF0000',
        scale: 1,
        rotation: 1.57,
      } as Car,
    ];
    storeState.points = [
      { id: 'p-1', carId: 'car-1', x: 10, y: 20, z: 0 } as Point,
      { id: 'p-2', carId: 'other', x: 99, y: 99, z: 0 } as Point,
    ];
    storeState.lidars = [
      {
        id: 'l-1',
        carId: 'car-1',
        x: 0,
        y: 1,
        z: 2,
        rotation: 0,
        range: 50,
        channels: 16,
        rotation_frequency: 10,
      } as Lidar,
    ];
    storeState.selectedId = 'car-1';

    const payload = buildScenarioPayload();
    const carGroup = payload.scenario.find((g) => g.vehicle === 'car')!;
    const carPath = carGroup.path[0];

    expect(carPath.model).toBe('audi');
    expect(carPath.color).toBe(0xff0000);
    expect(carPath.rotation).toBe(Math.floor(1.57 * 57.32));
    expect(carPath.selected).toBe(true);
    expect(carPath.points).toHaveLength(1);
    expect(carPath.points![0]).toMatchObject({ id: 0, x: 10, y: 20, z: 0 });
    expect(carPath.lidars).toHaveLength(1);
    expect(carPath.lidars![0].channels).toBe(16);
  });

  it('marks car as not selected when id does not match selectedId', () => {
    storeState.cars = [
      {
        id: 'car-2',
        x: 0,
        y: 0,
        z: 0,
        model: 'bmw',
        color: '000000',
        scale: 1,
        rotation: 0,
      } as Car,
    ];
    storeState.selectedId = 'car-1';

    const payload = buildScenarioPayload();
    const carGroup = payload.scenario[0] as Extract<
      (typeof payload.scenario)[0],
      { vehicle: 'car' }
    >;
    const carPath = carGroup.path[0];

    expect(carPath.selected).toBe(false);
  });

  it('maps RSU fields correctly', () => {
    storeState.RSUs = [
      {
        x: 5,
        y: 6,
        z: 7,
        tx_power: 20,
        frequency: 5.9e9,
        range: 100,
        protocol: 'ITS-G5',
        script: undefined,
      } as Partial<RSU> as RSU,
    ];

    const payload = buildScenarioPayload();
    const rsuGroup = payload.scenario.find((g) => g.vehicle === 'RSU')!;
    const rsuPath = rsuGroup.path[0];

    expect(rsuPath.x).toBe(5);
    expect(rsuPath.tx_power).toBe(20);
    expect(rsuPath.protocol).toBe('ITS-G5');
    expect(rsuPath.script).toBeNull();
  });

  it('sets RSU script to null when undefined', () => {
    storeState.RSUs = [
      {
        id: 'rsu-2',
        x: 0,
        y: 0,
        z: 0,
        tx_power: 10,
        frequency: 5.9e9,
        range: 50,
        protocol: 'DSRC',
        script: undefined,
      } as Partial<RSU> as RSU,
    ];

    const payload = buildScenarioPayload();
    const rsuGroup = payload.scenario.find((g) => g.vehicle === 'RSU')!;
    const rsuPath = rsuGroup.path[0];
    expect(rsuPath.script).toBeNull();
  });

  it('maps building fields correctly', () => {
    storeState.buildings = [
      {
        id: 'b-1',
        x: 1,
        y: 2,
        z: 3,
        height: 10,
        material: 'concrete',
      } as Building,
    ];

    const payload = buildScenarioPayload();
    const buildingGroup = payload.scenario.find(
      (g) => g.vehicle === 'building',
    )!;
    const building = buildingGroup.path[0];

    expect(building.id).toBe('b-1');
    expect(building.height).toBe(10);
    expect(building.material).toBe('concrete');
  });

  it('maps pedestrian fields correctly', () => {
    storeState.pedestrians = [
      {
        id: 'ped-1',
        x: 3,
        y: 4,
        z: 0,
        speed: 1.2,
        cross_factor: 0.5,
        is_invincible: false,
        tx_power: 10,
        frequency: 5.9e9,
        protocol: 'DSRC',
        beacon_interval: 1000,
      } as Pedestrian,
    ];

    const payload = buildScenarioPayload();
    const pedGroup = payload.scenario.find((g) => g.vehicle === 'pedestrian')!;
    const ped = pedGroup.path[0];

    expect(ped.id).toBe('ped-1');
    expect(ped.speed).toBe(1.2);
    expect(ped.is_invincible).toBe(false);
    expect(ped.beacon_interval).toBe(1000);
  });

  it('returns empty path arrays when store collections are empty', () => {
    const payload = buildScenarioPayload();
    expect(payload.scenario).toHaveLength(0);
  });

  it('uses simConfig map when available', () => {
    (storeState as unknown as EditorState).simConfig = {
      carla: { map: 'town05' } as EditorState['simConfig']['carla'],
    } as EditorState['simConfig'];

    const payload = buildScenarioPayload();

    expect(payload.map).toBe('town05');
  });
  it('calls scenariosApi.get via queryFn', async () => {
    getScenarioMock.mockResolvedValue({
      scenario: { scenario_id: 'q-1', scenario_text: [] },
    });

    fetchQueryMock.mockImplementation(
      ({ queryFn }: { queryFn: () => unknown }) => queryFn(),
    );

    await handleLoad({
      hasId: true,
      scenarioIdInput: 'q-1',
      sceneRef: { current: null } as unknown as React.RefObject<
        THREE.Scene | undefined
      >,
      setNotice: vi.fn(),
      loadRSURef: { current: vi.fn() } as unknown as React.RefObject<
        () => void
      >,
      buildingModelRef: {
        current: null,
      } as unknown as React.RefObject<THREE.Mesh | null>,
      updateSceneGraph: vi.fn(),
      loadFile: vi.fn(),
    });

    expect(getScenarioMock).toHaveBeenCalledWith('q-1');
  });
  it('stops retrying after 10 attempts when scene is never ready', async () => {
    vi.useFakeTimers();

    fetchQueryMock.mockResolvedValue({
      scenario: {
        scenario_id: 'retry-max',
        scenario_text: [
          {
            vehicle: 'building',
            path: [{ x: 1, y: 2, z: 3 }],
          },
        ],
      },
    });

    storeState.buildings = [{ id: 'b-1', x: 1, y: 2, z: 3 }] as Building[];

    const mockModel = { clone: vi.fn() };

    await handleLoad({
      hasId: true,
      scenarioIdInput: 'retry-max',
      sceneRef: { current: null } as unknown as React.RefObject<
        THREE.Scene | undefined
      >,
      setNotice: vi.fn(),
      loadRSURef: { current: vi.fn() } as unknown as React.RefObject<
        () => void
      >,
      buildingModelRef: {
        current: mockModel,
      } as unknown as React.RefObject<THREE.Mesh | null>,
      updateSceneGraph: vi.fn(),
      loadFile: vi.fn(),
    });

    for (let i = 0; i < 11; i++) {
      vi.advanceTimersByTime(300);
    }

    expect(mockModel.clone).not.toHaveBeenCalled();

    vi.useRealTimers();
  });
  it('defaults map to town10 when simConfig is absent', () => {
    const payload = buildScenarioPayload();

    expect(payload.map).toBe('town10');
  });

  it('defaults car rotation to 0 when rotation is undefined', () => {
    storeState.cars = [
      {
        x: 0,
        y: 0,
        z: 0,
        model: 'vw',
        color: '000000',
        scale: 1,
        rotation: undefined,
      } as Partial<Car> as Car,
    ];

    const payload = buildScenarioPayload();
    const carGroup = payload.scenario[0] as Extract<
      (typeof payload.scenario)[0],
      { vehicle: 'car' }
    >;
    const carPath = carGroup.path[0];
    expect(carPath.rotation).toBe(0);
  });
  describe('handleCreate', () => {
    it('calls mutateAsync and sets success notice', async () => {
      const setNotice = vi.fn();
      const createMutation = {
        mutateAsync: vi.fn().mockResolvedValue({}),
      } as unknown as ReturnType<typeof useScenarioCreateMutation>;

      await handleCreate(setNotice, createMutation);

      expect(createMutation.mutateAsync).toHaveBeenCalled();
      expect(setNotice).toHaveBeenCalledWith('Script saved (POST).');
    });

    it('sets error notice when mutateAsync throws', async () => {
      const setNotice = vi.fn();
      const createMutation = {
        mutateAsync: vi.fn().mockRejectedValue(new Error('network error')),
      } as unknown as ReturnType<typeof useScenarioCreateMutation>;

      await handleCreate(setNotice, createMutation);

      expect(setNotice).toHaveBeenCalledWith(
        expect.stringContaining('Failed to save script.'),
      );
    });
  });

  describe('handlePatch', () => {
    it('returns early when hasId is false', async () => {
      const setNotice = vi.fn();

      await handleLoad({
        hasId: false,
        scenarioIdInput: 'sc-1',
        sceneRef: { current: null } as unknown as React.RefObject<
          THREE.Scene | undefined
        >,
        setNotice,
        loadRSURef: { current: vi.fn() } as unknown as React.RefObject<
          () => void
        >,
        buildingModelRef: {
          current: null,
        } as unknown as React.RefObject<THREE.Mesh | null>,
        updateSceneGraph: vi.fn(),
        loadFile: vi.fn(),
      });

      expect(fetchQueryMock).not.toHaveBeenCalled();
      expect(setNotice).not.toHaveBeenCalled();
    });
    it('retries tryAddBuildings until scene is ready', async () => {
      vi.useFakeTimers();

      fetchQueryMock.mockResolvedValue({
        scenario: {
          scenario_id: 'retry-1',
          scenario_text: [
            {
              vehicle: 'building',
              path: [{ x: 1, y: 2, z: 3, height: 5, material: 'brick' }],
            },
          ],
        },
      });

      storeState.buildings = [
        { id: 'b-1', x: 1, y: 2, z: 3, rotation: 0, scale: 1 },
      ] as Building[];

      const sceneRef: { current: THREE.Scene | null } = { current: null };
      const clonedMesh = {
        userData: {},
        position: { set: vi.fn() },
        rotation: { y: 0 },
        scale: { setScalar: vi.fn() },
      };
      const mockModel = { clone: vi.fn().mockReturnValue(clonedMesh) };
      const loadRSU = vi.fn();
      const updateSceneGraph = vi.fn();

      await handleLoad({
        hasId: true,
        scenarioIdInput: 'retry-1',
        sceneRef: sceneRef as unknown as React.RefObject<
          THREE.Scene | undefined
        >,
        setNotice: vi.fn(),
        loadRSURef: { current: loadRSU } as unknown as React.RefObject<
          () => void
        >,
        buildingModelRef: {
          current: mockModel,
        } as unknown as React.RefObject<THREE.Mesh | null>,
        updateSceneGraph,
        loadFile: vi.fn(),
      });

      expect(mockModel.clone).not.toHaveBeenCalled();

      sceneRef.current = {
        children: [],
        add: vi.fn(),
      } as unknown as THREE.Scene;
      vi.runAllTimers();

      expect(mockModel.clone).toHaveBeenCalledWith(true);
      expect(clonedMesh.position.set).toHaveBeenCalledWith(1, 2, 3);
      expect(loadRSU).toHaveBeenCalled();

      vi.useRealTimers();
    });
    it('updatePedestrian with wrong id leaves pedestrians unchanged', () => {
      storeState.pedestrians = [
        {
          id: 'ped-1',
          x: 3,
          y: 4,
          z: 0,
          speed: 1.2,
          cross_factor: 0.5,
          is_invincible: false,
          tx_power: 10,
          frequency: 5.9e9,
          protocol: 'DSRC',
          beacon_interval: 1000,
        } as Pedestrian,
      ];

      useEditorStore.getState().updatePedestrian('wrong-id', { speed: 99 });

      expect(useEditorStore.getState().pedestrians[0].speed).toBe(1.2);
    });
    it('calls mutateAsync with trimmed id and sets success notice', async () => {
      const setNotice = vi.fn();
      const patchMutation = {
        mutateAsync: vi.fn().mockResolvedValue({}),
      } as unknown as ReturnType<typeof useScenarioPatchMutation>;

      await handlePatch(setNotice, '  sc-1  ', true, patchMutation);

      expect(patchMutation.mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'sc-1' }),
      );
      expect(setNotice).toHaveBeenCalledWith(
        'The script has been updated (PATCH).',
      );
    });
    it('calls updateRSU when RSU is found after addRSU', async () => {
      fetchQueryMock.mockResolvedValue({
        scenario: {
          scenario_id: 'rsu-update',
          scenario_text: [
            {
              vehicle: 'RSU',
              path: [
                {
                  x: 1,
                  y: 2,
                  z: 3,
                  tx_power: 30,
                  frequency: 5.9e9,
                  range: 300,
                  protocol: 'ITS-G5',
                  script: 'my-script',
                },
              ],
            },
          ],
        },
      });

      const newRSU = { id: 'rsu-new' };
      storeState.addRSU = vi.fn(() => {
        storeState.RSUs.push(newRSU as RSU);
      });
      storeState.RSUs = [];

      await handleLoad({
        hasId: true,
        scenarioIdInput: 'rsu-update',
        sceneRef: {
          current: { children: [], add: vi.fn() },
        } as unknown as React.RefObject<THREE.Scene | undefined>,
        setNotice: vi.fn(),
        loadRSURef: { current: vi.fn() } as unknown as React.RefObject<
          () => void
        >,
        buildingModelRef: {
          current: null,
        } as unknown as React.RefObject<THREE.Mesh | null>,
        updateSceneGraph: vi.fn(),
        loadFile: vi.fn(),
      });

      expect(storeState.updateRSU).toHaveBeenCalledWith(
        'rsu-new',
        expect.objectContaining({
          tx_power: 30,
          range: 300,
          script: 'my-script',
        }),
      );
    });
    it('skips updateRSU when RSUs is empty after addRSU', async () => {
      fetchQueryMock.mockResolvedValue({
        scenario: {
          scenario_id: 'rsu-skip',
          scenario_text: [
            {
              vehicle: 'RSU',
              path: [
                {
                  x: 0,
                  y: 0,
                  z: 0,
                  tx_power: 23,
                  frequency: 5.9e9,
                  range: 500,
                  protocol: 'ITS-G5',
                  script: '',
                },
              ],
            },
          ],
        },
      });

      storeState.RSUs = [];
      storeState.addRSU = vi.fn();

      await handleLoad({
        hasId: true,
        scenarioIdInput: 'rsu-skip',
        sceneRef: {
          current: { children: [], add: vi.fn() },
        } as unknown as React.RefObject<THREE.Scene | undefined>,
        setNotice: vi.fn(),
        loadRSURef: { current: vi.fn() } as unknown as React.RefObject<
          () => void
        >,
        buildingModelRef: {
          current: null,
        } as unknown as React.RefObject<THREE.Mesh | null>,
        updateSceneGraph: vi.fn(),
        loadFile: vi.fn(),
      });

      expect(storeState.updateRSU).not.toHaveBeenCalled();
    });
    it('skips updateRSU when added RSU is not found', async () => {
      fetchQueryMock.mockResolvedValue({
        scenario: {
          scenario_id: 'rsu-skip',
          scenario_text: [
            {
              vehicle: 'RSU',
              path: [
                {
                  x: 0,
                  y: 0,
                  z: 0,
                  tx_power: 23,
                  frequency: 5.9e9,
                  range: 500,
                  protocol: 'ITS-G5',
                  script: '',
                },
              ],
            },
          ],
        },
      });

      storeState.RSUs = [];
      storeState.addRSU = vi.fn();

      await handleLoad({
        hasId: true,
        scenarioIdInput: 'rsu-skip',
        sceneRef: {
          current: { children: [], add: vi.fn() },
        } as unknown as React.RefObject<THREE.Scene | undefined>,
        setNotice: vi.fn(),
        loadRSURef: { current: vi.fn() } as unknown as React.RefObject<
          () => void
        >,
        buildingModelRef: {
          current: null,
        } as unknown as React.RefObject<THREE.Mesh | null>,
        updateSceneGraph: vi.fn(),
        loadFile: vi.fn(),
      });

      expect(storeState.updateRSU).not.toHaveBeenCalled();
    });
    it('sets error notice when mutateAsync throws', async () => {
      const setNotice = vi.fn();
      const patchMutation = {
        mutateAsync: vi.fn().mockRejectedValue(new Error('fail')),
      } as unknown as ReturnType<typeof useScenarioPatchMutation>;

      await handlePatch(setNotice, 'sc-1', true, patchMutation);

      expect(setNotice).toHaveBeenCalledWith(
        expect.stringContaining('Failed to update the script (PATCH).'),
      );
    });
  });

  describe('handleDelete', () => {
    it('returns early when hasId is false', async () => {
      const setNotice = vi.fn();
      const putMutation = { mutateAsync: vi.fn() } as unknown as ReturnType<
        typeof useScenarioPutMutation
      >;

      await handleDelete(setNotice, 'sc-1', false, putMutation);

      expect(putMutation.mutateAsync).not.toHaveBeenCalled();
    });

    it('calls mutateAsync with trimmed id and sets success notice', async () => {
      const setNotice = vi.fn();
      const putMutation = { mutateAsync: vi.fn() } as unknown as ReturnType<
        typeof useScenarioPutMutation
      >;

      await handleDelete(setNotice, '  sc-1  ', true, putMutation);

      expect(putMutation.mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'sc-1' }),
      );
      expect(setNotice).toHaveBeenCalledWith(
        'The script has been deleted (DELETE).',
      );
    });

    it('sets error notice when mutateAsync throws', async () => {
      const setNotice = vi.fn();
      const putMutation = {
        mutateAsync: vi.fn().mockRejectedValue(new Error('fail')),
      } as unknown as ReturnType<typeof useScenarioPutMutation>;

      await handleDelete(setNotice, 'sc-1', true, putMutation);

      expect(setNotice).toHaveBeenCalledWith(
        expect.stringContaining('Failed to delete script (DELETE).'),
      );
    });
  });

  describe('handleRunSimulation', () => {
    it('calls mutate with correct payload and triggers onSuccess', () => {
      storeState.Scenario = {
        id: 'sc-1',
        name: 'Test',
        weather: 'Rain',
      } as unknown as Scenario;
      const setNotice = vi.fn();
      const startMutation = {
        mutate: vi.fn((_, { onSuccess }) => onSuccess()),
      } as unknown as ReturnType<typeof useStartSimulationMutation>;

      handleRunSimulation(setNotice, 'sc-1', startMutation);

      expect(startMutation.mutate).toHaveBeenCalledWith(
        expect.objectContaining({
          scenario_id: 'sc-1',
          scenario_name: 'Test',
          weather: 'Rain',
        }),
        expect.any(Object),
      );
      expect(setNotice).toHaveBeenCalledWith('The simulation has started.');
    });

    it('falls back to scenarioIdInput when store id is empty', () => {
      storeState.Scenario = {
        id: '',
        name: '',
        weather: '',
      } as unknown as Scenario;
      const setNotice = vi.fn();
      const startMutation = {
        mutate: vi.fn((_, { onSuccess }) => onSuccess()),
      } as unknown as ReturnType<typeof useStartSimulationMutation>;

      handleRunSimulation(setNotice, '  sc-fallback  ', startMutation);

      expect(startMutation.mutate).toHaveBeenCalledWith(
        expect.objectContaining({ scenario_id: 'sc-fallback' }),
        expect.any(Object),
      );
    });

    it('sets error notice when mutate triggers onError', async () => {
      storeState.Scenario = {
        id: 'sc-1',
        name: 'Test',
        weather: 'Rain',
      } as unknown as Scenario;
      const setNotice = vi.fn();
      const startMutation = {
        mutate: vi.fn((_, { onError }) => onError(new Error('sim error'))),
      } as unknown as ReturnType<typeof useStartSimulationMutation>;

      handleRunSimulation(setNotice, 'sc-1', startMutation);

      await vi.waitFor(() => {
        expect(setNotice).toHaveBeenCalledWith(
          expect.stringContaining('Failed to start simulation.'),
        );
      });
    });
  });
  it('clones building model and adds to scene when scene and model are ready', async () => {
    vi.useFakeTimers();

    fetchQueryMock.mockResolvedValue({
      scenario: {
        scenario_id: 'b-scene-1',
        name_of_scenario: 'Building Scene',
        scenario_text: [
          {
            vehicle: 'building',
            path: [{ x: 1, y: 2, z: 3, height: 5, material: 'brick' }],
          },
        ],
      },
    });

    storeState.buildings = [
      { id: 'b-1', x: 1, y: 2, z: 3, rotation: 0.5, scale: 1 },
    ] as Building[];

    const clonedMesh = {
      userData: {},
      position: { set: vi.fn() },
      rotation: { y: 0 },
      scale: { setScalar: vi.fn() },
    };

    const mockModel = { clone: vi.fn().mockReturnValue(clonedMesh) };
    const mockScene = { children: [], add: vi.fn() };
    const loadRSU = vi.fn();
    const updateSceneGraph = vi.fn();
    const setNotice = vi.fn();

    await handleLoad({
      hasId: true,
      scenarioIdInput: 'b-scene-1',
      sceneRef: { current: mockScene } as unknown as React.RefObject<
        THREE.Scene | undefined
      >,
      setNotice,
      loadRSURef: { current: loadRSU } as unknown as React.RefObject<
        () => void
      >,
      buildingModelRef: {
        current: mockModel,
      } as unknown as React.RefObject<THREE.Object3D | null>,
      updateSceneGraph,
      loadFile: vi.fn(),
    });

    vi.runAllTimers();

    expect(mockModel.clone).toHaveBeenCalledWith(true);
    expect(clonedMesh.position.set).toHaveBeenCalledWith(1, 2, 3);
    expect(clonedMesh.scale.setScalar).toHaveBeenCalledWith(1);
    expect(mockScene.add).toHaveBeenCalledWith(clonedMesh);
    expect(loadRSU).toHaveBeenCalled();
    expect(updateSceneGraph).toHaveBeenCalled();

    vi.useRealTimers();
  });

  it('skips building already present in scene', async () => {
    vi.useFakeTimers();

    const buildingId = 'b-existing';

    storeState.addBuilding = vi.fn().mockReturnValue(buildingId);
    storeState.buildings = [{ id: buildingId, x: 1, y: 2, z: 3 }] as Building[];

    fetchQueryMock.mockResolvedValue({
      scenario: {
        scenario_id: 'b-skip-1',
        scenario_text: [
          {
            vehicle: 'building',
            path: [{ x: 1, y: 2, z: 3 }],
          },
        ],
      },
    });

    const mockModel = { clone: vi.fn() };
    const existingChild = { userData: { id: buildingId } };
    const mockScene = { children: [existingChild], add: vi.fn() };

    await handleLoad({
      hasId: true,
      scenarioIdInput: 'b-skip-1',
      sceneRef: { current: mockScene } as unknown as React.RefObject<
        THREE.Scene | undefined
      >,
      setNotice: vi.fn(),
      loadRSURef: { current: vi.fn() } as unknown as React.RefObject<
        () => void
      >,
      buildingModelRef: {
        current: mockModel,
      } as unknown as React.RefObject<THREE.Object3D | null>,
      updateSceneGraph: vi.fn(),
      loadFile: vi.fn(),
    });

    vi.runAllTimers();

    expect(mockModel.clone).not.toHaveBeenCalled();
    expect(mockScene.add).not.toHaveBeenCalled();

    vi.useRealTimers();
  });

  it('sets error notice when fetchQuery throws', async () => {
    fetchQueryMock.mockRejectedValue(new Error('fetch failed'));
    const setNotice = vi.fn();

    await handleLoad({
      hasId: true,
      scenarioIdInput: 'bad-id',
      sceneRef: {
        current: { children: [], add: vi.fn() },
      } as unknown as React.RefObject<THREE.Scene | undefined>,
      setNotice,
      loadRSURef: { current: vi.fn() } as unknown as React.RefObject<
        () => void
      >,
      buildingModelRef: {
        current: {},
      } as unknown as React.RefObject<THREE.Object3D | null>,
      updateSceneGraph: vi.fn(),
      loadFile: vi.fn(),
    });

    expect(setNotice).toHaveBeenCalledWith('Failed to load script.');
  });
  it('returns early when hasId is false', async () => {
    const setNotice = vi.fn();

    await handleLoad({
      hasId: false,
      scenarioIdInput: 'sc-1',
      sceneRef: { current: null } as unknown as React.RefObject<
        THREE.Scene | undefined
      >,
      setNotice,
      loadRSURef: { current: vi.fn() } as unknown as React.RefObject<
        () => void
      >,
      buildingModelRef: {
        current: null,
      } as unknown as React.RefObject<THREE.Object3D | null>,
      updateSceneGraph: vi.fn(),
      loadFile: vi.fn(),
    });

    expect(fetchQueryMock).not.toHaveBeenCalled();
    expect(setNotice).not.toHaveBeenCalled();
  });

  it('processes car lidars and calls updateLidar', async () => {
    fetchQueryMock.mockResolvedValue({
      scenario: {
        scenario_id: 'lidar-test',
        scenario_text: [
          {
            vehicle: 'car',
            path: [
              {
                x: 0,
                y: 0,
                z: 0,
                model: 'car',
                color: 'ffffff',
                points: [],
                lidars: [
                  {
                    x: 0,
                    y: 1,
                    z: 2,
                    rotation: 45,
                    range: 100,
                    channels: 32,
                    rotation_frequency: 20,
                  },
                ],
              },
            ],
          },
        ],
      },
    });

    storeState.lidars = [{ id: 'lidar-1' }] as Lidar[];

    await handleLoad({
      hasId: true,
      scenarioIdInput: 'lidar-test',
      sceneRef: { current: null } as unknown as React.RefObject<
        THREE.Scene | undefined
      >,
      setNotice: vi.fn(),
      loadRSURef: { current: vi.fn() } as unknown as React.RefObject<
        () => void
      >,
      buildingModelRef: {
        current: null,
      } as unknown as React.RefObject<THREE.Object3D | null>,
      updateSceneGraph: vi.fn(),
      loadFile: vi.fn(),
    });

    expect(storeState.addLidar).toHaveBeenCalledWith('car-1', 0, 1, 2);
    expect(storeState.updateLidar).toHaveBeenCalledWith('lidar-1', {
      rotation: 45,
      range: 100,
      channels: 32,
      rotation_frequency: 20,
    });
  });

  it('retries tryAddBuildings when scene or model is not ready', async () => {
    vi.useFakeTimers();

    fetchQueryMock.mockResolvedValue({
      scenario: {
        scenario_id: 'retry-test',
        scenario_text: [
          {
            vehicle: 'building',
            path: [{ x: 1, y: 2, z: 3, height: 5, material: 'brick' }],
          },
        ],
      },
    });

    storeState.buildings = [{ id: 'b-1', x: 1, y: 2, z: 3 }] as Building[];

    const sceneRef = {
      current: null as unknown as THREE.Scene | undefined,
    } as unknown as React.RefObject<THREE.Scene | undefined>;
    const mockModel = {
      clone: vi.fn().mockReturnValue({
        userData: {},
        position: { set: vi.fn() },
        rotation: { y: 0 },
        scale: { setScalar: vi.fn() },
      }),
    };
    const loadRSU = vi.fn();

    await handleLoad({
      hasId: true,
      scenarioIdInput: 'retry-test',
      sceneRef,
      setNotice: vi.fn(),
      loadRSURef: { current: loadRSU } as unknown as React.RefObject<
        () => void
      >,
      buildingModelRef: {
        current: mockModel,
      } as unknown as React.RefObject<THREE.Object3D | null>,
      updateSceneGraph: vi.fn(),
      loadFile: vi.fn(),
    });

    expect(mockModel.clone).not.toHaveBeenCalled();

    (sceneRef as unknown as { current: unknown }).current = {
      children: [],
      add: vi.fn(),
    };
    vi.runAllTimers();

    expect(mockModel.clone).toHaveBeenCalled();
    expect(loadRSU).toHaveBeenCalled();

    vi.useRealTimers();
  });
});
