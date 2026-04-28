import { describe, expect, it, vi } from 'vitest';

const { fetchQueryMock, getScenarioMock } = vi.hoisted(() => ({
  fetchQueryMock: vi.fn(),
  getScenarioMock: vi.fn(),
}));

vi.mock('../../../../../../../api/queryClient', () => ({
  queryClient: {
    fetchQuery: fetchQueryMock,
  },
}));

vi.mock('../../../../../../../api/scenarios', () => ({
  scenariosApi: {
    get: getScenarioMock,
  },
}));

vi.mock('../../../../../../Editor/hooks/useApiHooks/useScenarioQueries', () => ({
  scenarioKeys: {
    detail: (id: string) => ['scenario', id],
  },
  useScenarioCreateMutation: () => ({}),
  useScenarioPatchMutation: () => ({}),
  useScenarioPutMutation: () => ({}),
}));

vi.mock(
  '../../../../../../Editor/hooks/useApiHooks/useSimulationMutation',
  () => ({
    useStartSimulationMutation: () => ({}),
  }),
);

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
    updatePedestrian: vi.fn(),
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
  useEditorStore: {
    getState: () => storeState,
  },
}));

import { handleLoad } from './scenario.handlers';

describe('handleLoad regression', () => {
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
      }),
    ).resolves.toBeUndefined();

    vi.runAllTimers();
    expect(setNotice).toHaveBeenCalledWith('The script has been uploaded.');
    vi.useRealTimers();
  });
});
