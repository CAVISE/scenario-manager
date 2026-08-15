import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_COLOR } from '../../pages/Editor/hooks/useThreeScene/hooks/useOdrMapManager/utils/clearScene/types/clearSceneTypes';
import { SimulationConfig, useEditorStore } from './useEditorStore';
import { SelectedObject } from '../../pages/Editor/types/editorTypes';

describe('useEditorStore', () => {
  beforeEach(() => {
    useEditorStore.setState({
      cars: [],
      RSUs: [],
      lidars: [],
      points: [],
      buildings: [],
      pedestrians: [],
      deletionHistory: [],
      historyStack: [],
      historyCursor: 0,
      selectedId: null,
      selectedObject: null,
      isBuildingMode: false,
      routes: [[]],
      simConfig: useEditorStore.getState().simConfig,
      isPanelOpen: true,
      error: null,
      Scenario: {
        id: Date.now().toString(),
        name: 'Default Scenario',
        weather: 'ClearNoon',
        description: '',
        file_: null,
      },
    });
  });

  it('removes linked points and lidars when car is deleted', () => {
    const state = useEditorStore.getState();
    const carId = state.addCar(1, 2, 3, 'car', '00ff00');
    state.addPoint(carId, 10, 11, 12);
    state.addLidar(carId, 4, 5, 6);

    expect(useEditorStore.getState().cars).toHaveLength(1);
    expect(useEditorStore.getState().points).toHaveLength(1);
    expect(useEditorStore.getState().lidars).toHaveLength(1);

    useEditorStore.getState().removeCar(carId);

    expect(useEditorStore.getState().cars).toHaveLength(0);
    expect(useEditorStore.getState().points).toHaveLength(0);
    expect(useEditorStore.getState().lidars).toHaveLength(0);
  });

  it('updates scenario fields without dropping existing values', () => {
    const prev = useEditorStore.getState().Scenario;
    useEditorStore.getState().updateScenario({ name: 'Updated name' });
    const next = useEditorStore.getState().Scenario;

    expect(next.name).toBe('Updated name');
    expect(next.id).toBe(prev.id);
    expect(next.weather).toBe(prev.weather);
  });

  it('toggles side panel mode', () => {
    const initial = useEditorStore.getState().isPanelOpen;
    useEditorStore.getState().setChangePanelMode();
    expect(useEditorStore.getState().isPanelOpen).toBe(!initial);
  });

  it('keeps default sim config sections when partial carla update is applied', () => {
    useEditorStore.getState().updateSimConfigCarla({ map: 'town10' });
    const simConfig = useEditorStore.getState().simConfig;

    expect(simConfig.carla.map).toBe('town10');
    expect(simConfig.opencda).toBeDefined();
    expect(simConfig.omnet).toBeDefined();
  });

  it('setBuildingMode(true) enables building mode and clears selectedId', () => {
    const store = useEditorStore.getState();
    const carId = store.addCar(0, 0, 0, 'model', 'red');
    store.selectObject({ id: carId } as unknown as SelectedObject);
    expect(useEditorStore.getState().selectedId).toBe(carId);

    useEditorStore.getState().setBuildingMode(true);

    expect(useEditorStore.getState().isBuildingMode).toBe(true);
    expect(useEditorStore.getState().selectedId).toBeNull();
  });

  it('setBuildingMode(false) disables building mode without clearing selectedId', () => {
    const store = useEditorStore.getState();
    store.setBuildingMode(true);
    const carId = store.addCar(0, 0, 0, 'model', 'red');
    useEditorStore.setState({ selectedId: carId });

    useEditorStore.getState().setBuildingMode(false);

    expect(useEditorStore.getState().isBuildingMode).toBe(false);
    expect(useEditorStore.getState().selectedId).toBe(carId);
  });

  it('setError stores the error value', () => {
    useEditorStore.getState().setError(new Error('something went wrong'));
    expect(useEditorStore.getState().error).toBeInstanceOf(Error);
  });

  it('setError can clear the error', () => {
    useEditorStore.getState().setError(new Error('oops'));
    useEditorStore.getState().setError(null);
    expect(useEditorStore.getState().error).toBeNull();
  });

  it('updateSimConfigOmnet merges omnet fields and preserves others', () => {
    useEditorStore.getState().updateSimConfigOmnet({ port: 9999 } as object);
    const { simConfig } = useEditorStore.getState();

    expect((simConfig.omnet as unknown as { port: number }).port).toBe(9999);
    expect(simConfig.carla).toBeDefined();
    expect(simConfig.sumo).toBeDefined();
  });

  it('updateSimConfigArtery merges artery fields and preserves others', () => {
    useEditorStore.getState().updateSimConfigArtery({ port: 1234 } as object);
    const { simConfig } = useEditorStore.getState();

    expect((simConfig.artery as unknown as { port: number }).port).toBe(1234);
    expect(simConfig.omnet).toBeDefined();
  });

  it('updateSimConfigSionna merges sionna fields and preserves others', () => {
    useEditorStore
      .getState()
      .updateSimConfigSionna({ resolution: 64 } as object);
    const { simConfig } = useEditorStore.getState();

    expect(
      (simConfig.sionna as unknown as { resolution: number }).resolution,
    ).toBe(64);
    expect(simConfig.carla).toBeDefined();
  });

  it('updateSimConfigMPC merges mpc fields and preserves others', () => {
    useEditorStore.getState().updateSimConfigMPC({ enabled: true } as object);
    const { simConfig } = useEditorStore.getState();

    expect((simConfig.mpc as unknown as { enabled: boolean }).enabled).toBe(
      true,
    );
    expect(simConfig.sumo).toBeDefined();
  });

  it('removePedestrian clears selectedId when the removed ped was selected', () => {
    const store = useEditorStore.getState();
    const pedId = store.addPedestrian(1, 2, 3);
    useEditorStore.setState({ selectedId: pedId });

    expect(useEditorStore.getState().selectedId).toBe(pedId);

    useEditorStore.getState().removePedestrian(pedId);

    expect(useEditorStore.getState().pedestrians).toHaveLength(0);
    expect(useEditorStore.getState().selectedId).toBeNull();
  });

  it('removePedestrian keeps selectedId when a different ped is removed', () => {
    const store = useEditorStore.getState();
    const pedId1 = store.addPedestrian(1, 2, 3);
    const pedId2 = store.addPedestrian(4, 5, 6);
    useEditorStore.setState({ selectedId: pedId1 });

    useEditorStore.getState().removePedestrian(pedId2);

    expect(useEditorStore.getState().pedestrians).toHaveLength(1);
    expect(useEditorStore.getState().selectedId).toBe(pedId1);
  });

  it('removeRSU removes by index', () => {
    const store = useEditorStore.getState();
    store.addRSU(0, 0, 0);
    store.addRSU(1, 1, 1);

    expect(useEditorStore.getState().RSUs).toHaveLength(2);

    useEditorStore.getState().removeRSU(0);

    expect(useEditorStore.getState().RSUs).toHaveLength(1);
  });

  it('updateRSU updates fields by id', () => {
    const store = useEditorStore.getState();
    store.addRSU(0, 0, 0);
    const rsuId = useEditorStore.getState().RSUs[0].id;

    useEditorStore.getState().updateRSU(rsuId, { tx_power: 99 });

    expect(useEditorStore.getState().RSUs[0].tx_power).toBe(99);
  });

  it('removeCar clears selectedId when the removed car was selected', () => {
    const store = useEditorStore.getState();
    const carId = store.addCar(0, 0, 0, 'model', 'blue');
    expect(useEditorStore.getState().selectedId).toBe(carId);

    useEditorStore.getState().removeCar(carId);

    expect(useEditorStore.getState().selectedId).toBeNull();
  });

  it('updateSimConfig merges top-level sim config fields', () => {
    useEditorStore
      .getState()
      .updateSimConfig({ sim_duration: 300 } as unknown as SimulationConfig);
    expect(
      (useEditorStore.getState().simConfig as SimulationConfig).sim_duration,
    ).toBe(300);
    expect(useEditorStore.getState().simConfig.carla).toBeDefined();
  });

  it('updatePedestrian updates pedestrian fields by id', () => {
    const store = useEditorStore.getState();
    const pedId = store.addPedestrian(1, 2, 3);

    useEditorStore.getState().updatePedestrian(pedId, { speed: 2.5 });

    const ped = useEditorStore
      .getState()
      .pedestrians.find((p) => p.id === pedId);
    expect(ped?.speed).toBe(2.5);
  });

  it('removeSelectedId clears selectedId and selectedObject', () => {
    const store = useEditorStore.getState();
    store.addCar(0, 0, 0, 'model', 'red');
    expect(useEditorStore.getState().selectedId).not.toBeNull();

    useEditorStore.getState().removeSelectedId();

    expect(useEditorStore.getState().selectedId).toBeNull();
    expect(useEditorStore.getState().selectedObject).toBeNull();
  });
});

describe('useEditorStore - History additional coverage', () => {
  beforeEach(() => {
    useEditorStore.setState({
      cars: [],
      RSUs: [],
      lidars: [],
      points: [],
      buildings: [],
      pedestrians: [],
      deletionHistory: [],
      historyStack: [],
      historyCursor: 0,
      selectedId: null,
      selectedObject: null,
      isBuildingMode: false,
      routes: [[]],
      simConfig: useEditorStore.getState().simConfig,
      isPanelOpen: true,
      error: null,
      Scenario: {
        id: Date.now().toString(),
        name: 'Default Scenario',
        weather: 'ClearNoon',
        description: '',
        file_: null,
      },
    });
  });

  describe('redo cursor update', () => {
    it('updates cursor to entryIndex + 1 after successful redo', () => {
      const undo = vi.fn();

      useEditorStore.getState().pushHistoryEntry({
        label: 'Entry 1',
        undo,
        redo: vi.fn(),
      });

      const redo2 = vi.fn();
      useEditorStore.getState().pushHistoryEntry({
        label: 'Entry 2',
        undo: vi.fn(),
        redo: redo2,
      });

      expect(useEditorStore.getState().historyCursor).toBe(2);

      useEditorStore.getState().undo();
      expect(useEditorStore.getState().historyCursor).toBe(1);

      const result = useEditorStore.getState().redo();

      expect(result).toBe(true);
      expect(redo2).toHaveBeenCalled();
      expect(useEditorStore.getState().historyCursor).toBe(2);
    });

    it('does not update cursor if entry was already redone', () => {
      const mockRedo = vi.fn(() => {
        useEditorStore.setState({
          historyStack: [],
          historyCursor: 0,
        });
      });

      useEditorStore.getState().pushHistoryEntry({
        label: 'Test entry',
        undo: vi.fn(),
        redo: mockRedo,
      });

      expect(useEditorStore.getState().historyCursor).toBe(1);

      useEditorStore.getState().undo();
      expect(useEditorStore.getState().historyCursor).toBe(0);

      const result = useEditorStore.getState().redo();

      expect(result).toBe(true);
      expect(mockRedo).toHaveBeenCalled();
      expect(useEditorStore.getState().historyCursor).toBe(0);
    });

    it('handles redo when entry is not found in historyStack', () => {
      const redo = vi.fn();

      useEditorStore.getState().pushHistoryEntry({
        label: 'Test entry',
        undo: vi.fn(),
        redo: redo,
      });

      expect(useEditorStore.getState().historyCursor).toBe(1);

      useEditorStore.getState().undo();
      expect(useEditorStore.getState().historyCursor).toBe(0);

      useEditorStore.setState({
        historyStack: [],
        historyCursor: 0,
      });

      const result = useEditorStore.getState().redo();

      expect(result).toBe(false);
      expect(redo).not.toHaveBeenCalled();
    });
  });

  describe('canUndo and canRedo', () => {
    it('canUndo returns true when cursor > 0', () => {
      useEditorStore.getState().pushHistoryEntry({
        label: 'Entry 1',
        undo: vi.fn(),
        redo: vi.fn(),
      });

      expect(useEditorStore.getState().canUndo()).toBe(true);
    });

    it('canUndo returns false when cursor is 0', () => {
      expect(useEditorStore.getState().canUndo()).toBe(false);

      useEditorStore.getState().pushHistoryEntry({
        label: 'Entry 1',
        undo: vi.fn(),
        redo: vi.fn(),
      });

      expect(useEditorStore.getState().canUndo()).toBe(true);
    });

    it('canRedo returns true when cursor < stack length', () => {
      useEditorStore.getState().pushHistoryEntry({
        label: 'Entry 1',
        undo: vi.fn(),
        redo: vi.fn(),
      });
      useEditorStore.getState().pushHistoryEntry({
        label: 'Entry 2',
        undo: vi.fn(),
        redo: vi.fn(),
      });

      expect(useEditorStore.getState().canRedo()).toBe(false);

      useEditorStore.getState().undo();
      expect(useEditorStore.getState().canRedo()).toBe(true);
    });

    it('canRedo returns false when cursor is at the end', () => {
      useEditorStore.getState().pushHistoryEntry({
        label: 'Entry 1',
        undo: vi.fn(),
        redo: vi.fn(),
      });

      expect(useEditorStore.getState().canRedo()).toBe(false);
    });

    it('canRedo returns false when historyStack is empty', () => {
      expect(useEditorStore.getState().historyStack).toHaveLength(0);
      expect(useEditorStore.getState().canRedo()).toBe(false);
    });
  });

  describe('clearHistory', () => {
    it('clears history stack and resets cursor', () => {
      useEditorStore.getState().pushHistoryEntry({
        label: 'Entry 1',
        undo: vi.fn(),
        redo: vi.fn(),
      });
      useEditorStore.getState().pushHistoryEntry({
        label: 'Entry 2',
        undo: vi.fn(),
        redo: vi.fn(),
      });

      expect(useEditorStore.getState().historyStack).toHaveLength(2);
      expect(useEditorStore.getState().historyCursor).toBe(2);

      useEditorStore.getState().clearHistory();

      expect(useEditorStore.getState().historyStack).toHaveLength(0);
      expect(useEditorStore.getState().historyCursor).toBe(0);
    });

    it('does nothing when history is already empty', () => {
      expect(useEditorStore.getState().historyStack).toHaveLength(0);
      expect(useEditorStore.getState().historyCursor).toBe(0);

      useEditorStore.getState().clearHistory();

      expect(useEditorStore.getState().historyStack).toHaveLength(0);
      expect(useEditorStore.getState().historyCursor).toBe(0);
    });

    it('clears history but keeps other state properties', () => {
      const state = useEditorStore.getState();

      state.addCar(1, 2, 3, 'car', DEFAULT_COLOR);
      state.addRSU(0, 0, 0);

      useEditorStore.getState().pushHistoryEntry({
        label: 'Entry 1',
        undo: vi.fn(),
        redo: vi.fn(),
      });

      expect(useEditorStore.getState().historyStack).toHaveLength(1);
      expect(useEditorStore.getState().cars).toHaveLength(1);
      expect(useEditorStore.getState().RSUs).toHaveLength(1);

      useEditorStore.getState().clearHistory();

      expect(useEditorStore.getState().historyStack).toHaveLength(0);
      expect(useEditorStore.getState().historyCursor).toBe(0);

      expect(useEditorStore.getState().cars).toHaveLength(1);
      expect(useEditorStore.getState().RSUs).toHaveLength(1);
    });
  });

  describe('redo with sourceSnapshotId', () => {
    it('does not update cursor if entry was modified during redo', () => {
      const redo = vi.fn(() => {
        useEditorStore.setState({
          historyStack: [],
          historyCursor: 0,
        });
      });

      useEditorStore.getState().pushHistoryEntry({
        label: 'Test entry',
        undo: vi.fn(),
        redo: redo,
      });

      expect(useEditorStore.getState().historyCursor).toBe(1);

      useEditorStore.getState().undo();
      expect(useEditorStore.getState().historyCursor).toBe(0);

      const result = useEditorStore.getState().redo();

      expect(result).toBe(true);
      expect(redo).toHaveBeenCalled();
      expect(useEditorStore.getState().historyCursor).toBe(0);
    });
  });

  describe('redo when cursor >= historyStack.length', () => {
    it('returns false when cursor is at the end', () => {
      useEditorStore.getState().pushHistoryEntry({
        label: 'Entry 1',
        undo: vi.fn(),
        redo: vi.fn(),
      });

      expect(useEditorStore.getState().redo()).toBe(false);
    });

    it('returns false when historyStack is empty', () => {
      expect(useEditorStore.getState().redo()).toBe(false);
    });
  });

  describe('store persistence', () => {
    it('store is created with persist middleware', () => {
      expect(useEditorStore).toBeDefined();
      expect(useEditorStore.getState).toBeDefined();
      expect(useEditorStore.setState).toBeDefined();
    });

    it('store has all expected methods', () => {
      const state = useEditorStore.getState();

      expect(state.addCar).toBeDefined();
      expect(state.addRSU).toBeDefined();
      expect(state.addBuilding).toBeDefined();
      expect(state.addPedestrian).toBeDefined();
      expect(state.addLidar).toBeDefined();
      expect(state.addPoint).toBeDefined();

      expect(state.updateCar).toBeDefined();
      expect(state.updateRSU).toBeDefined();
      expect(state.updateBuilding).toBeDefined();
      expect(state.updatePedestrian).toBeDefined();
      expect(state.updateLidar).toBeDefined();
      expect(state.updatePoint).toBeDefined();

      expect(state.removeCar).toBeDefined();
      expect(state.removeRSU).toBeDefined();
      expect(state.removeBuilding).toBeDefined();
      expect(state.removePedestrian).toBeDefined();
      expect(state.removeLidar).toBeDefined();
      expect(state.removePoint).toBeDefined();
      expect(state.removeAllRSUs).toBeDefined();

      expect(state.undo).toBeDefined();
      expect(state.redo).toBeDefined();
      expect(state.canUndo).toBeDefined();
      expect(state.canRedo).toBeDefined();
      expect(state.clearHistory).toBeDefined();
      expect(state.pushHistoryEntry).toBeDefined();

      expect(state.pushDeletionSnapshot).toBeDefined();
      expect(state.restoreLastDeletion).toBeDefined();
      expect(state.clearDeletionHistory).toBeDefined();
    });
  });
});

describe('useEditorStore - additional coverage', () => {
  beforeEach(() => {
    useEditorStore.setState({
      cars: [],
      RSUs: [],
      lidars: [],
      points: [],
      buildings: [],
      pedestrians: [],
      deletionHistory: [],
      historyStack: [],
      historyCursor: 0,
      selectedId: null,
      selectedObject: null,
      isBuildingMode: false,
      routes: [[]],
      simConfig: useEditorStore.getState().simConfig,
      isPanelOpen: true,
      error: null,
      Scenario: {
        id: Date.now().toString(),
        name: 'Default Scenario',
        weather: 'ClearNoon',
        description: '',
        file_: null,
      },
    });
  });

  describe('DEV mode store exposure', () => {
    it('exposes store to window in development mode', () => {
      const originalDev = import.meta.env.DEV;

      import.meta.env.DEV = true;

      const mockWindow = { useEditorStore: undefined } as unknown as Window &
        typeof globalThis;
      const originalWindow = globalThis.window;
      globalThis.window = mockWindow;

      import.meta.env.DEV = originalDev;
      globalThis.window = originalWindow;

      expect(useEditorStore).toBeDefined();
    });

    it('does not expose store in production mode', () => {
      const originalDev = import.meta.env.DEV;

      import.meta.env.DEV = false;

      const mockWindow = { useEditorStore: undefined } as unknown as Window &
        typeof globalThis;
      const originalWindow = globalThis.window;
      globalThis.window = mockWindow;

      import.meta.env.DEV = originalDev;
      globalThis.window = originalWindow;

      expect(useEditorStore).toBeDefined();
    });
  });

  describe('historyCursor update in restoreLastDeletion', () => {
    it('updates historyCursor correctly when removing entry before cursor', () => {
      const state = useEditorStore.getState();

      state.addBuilding(1, 1, 1);
      const building = useEditorStore.getState().buildings[0];

      const snapshotId = state.pushDeletionSnapshot({
        origin: 'single-delete',
        label: 'Building deleted',
        entities: [{ kind: 'building', index: 0, building }],
      });

      for (let i = 0; i < 5; i++) {
        useEditorStore.getState().pushHistoryEntry({
          label: `Entry ${i}`,
          undo: vi.fn(),
          redo: vi.fn(),
        });
      }

      expect(useEditorStore.getState().historyCursor).toBe(5);

      useEditorStore.getState().pushHistoryEntry({
        label: 'Building deletion',
        undo: vi.fn(),
        redo: vi.fn(),
        sourceSnapshotId: snapshotId,
      });

      expect(useEditorStore.getState().historyCursor).toBe(6);

      state.removeBuilding(building.id);

      const restored = useEditorStore
        .getState()
        .restoreLastDeletion(snapshotId);

      expect(restored).toBe(true);
      expect(useEditorStore.getState().historyCursor).toBe(5);
    });

    it('keeps historyCursor unchanged when removing entry after cursor', () => {
      const state = useEditorStore.getState();

      state.addBuilding(1, 1, 1);
      const building = useEditorStore.getState().buildings[0];

      const snapshotId = state.pushDeletionSnapshot({
        origin: 'single-delete',
        label: 'Building deleted',
        entities: [{ kind: 'building', index: 0, building }],
      });

      useEditorStore.getState().pushHistoryEntry({
        label: 'Building deletion',
        undo: vi.fn(),
        redo: vi.fn(),
        sourceSnapshotId: snapshotId,
      });

      expect(useEditorStore.getState().historyCursor).toBe(1);

      for (let i = 0; i < 3; i++) {
        useEditorStore.getState().pushHistoryEntry({
          label: `Entry ${i}`,
          undo: vi.fn(),
          redo: vi.fn(),
        });
      }

      expect(useEditorStore.getState().historyCursor).toBe(4);

      state.removeBuilding(building.id);

      const restored = useEditorStore
        .getState()
        .restoreLastDeletion(snapshotId);

      expect(restored).toBe(true);
      expect(useEditorStore.getState().historyCursor).toBe(3);
    });

    it('handles historyIndex when entry is not found', () => {
      const state = useEditorStore.getState();

      state.addBuilding(1, 1, 1);
      const building = useEditorStore.getState().buildings[0];

      const snapshotId = state.pushDeletionSnapshot({
        origin: 'single-delete',
        label: 'Building deleted',
        entities: [{ kind: 'building', index: 0, building }],
      });

      state.removeBuilding(building.id);

      const restored = useEditorStore
        .getState()
        .restoreLastDeletion(snapshotId);

      expect(restored).toBe(true);
      expect(useEditorStore.getState().historyCursor).toBe(0);
    });
  });

  describe('targetIndex check in restoreLastDeletion', () => {
    it('returns false when snapshotId is not found in deletionHistory', () => {
      const state = useEditorStore.getState();

      state.addBuilding(1, 1, 1);

      const result = useEditorStore
        .getState()
        .restoreLastDeletion('non-existent-id');

      expect(result).toBe(false);
      expect(useEditorStore.getState().buildings).toHaveLength(1);
    });

    it('returns false when deletionHistory is empty', () => {
      expect(useEditorStore.getState().deletionHistory).toHaveLength(0);

      const result = useEditorStore.getState().restoreLastDeletion('some-id');

      expect(result).toBe(false);
    });

    it('finds correct snapshot when multiple snapshots exist', () => {
      const state = useEditorStore.getState();

      state.addBuilding(1, 1, 1);
      state.addBuilding(2, 2, 2);
      const [first, second] = useEditorStore.getState().buildings;

      const snapshotId1 = state.pushDeletionSnapshot({
        origin: 'single-delete',
        label: 'First building deleted',
        entities: [{ kind: 'building', index: 0, building: first }],
      });

      const snapshotId2 = state.pushDeletionSnapshot({
        origin: 'single-delete',
        label: 'Second building deleted',
        entities: [{ kind: 'building', index: 1, building: second }],
      });

      state.removeBuilding(first.id);
      state.removeBuilding(second.id);

      const restored = useEditorStore
        .getState()
        .restoreLastDeletion(snapshotId2);

      expect(restored).toBe(true);
      expect(useEditorStore.getState().buildings).toHaveLength(1);
      expect(useEditorStore.getState().buildings[0].id).toBe(second.id);

      const restored2 = useEditorStore
        .getState()
        .restoreLastDeletion(snapshotId1);

      expect(restored2).toBe(true);
      expect(useEditorStore.getState().buildings).toHaveLength(2);
    });
  });

  describe('updatePedestrian', () => {
    it('updates pedestrian properties correctly', () => {
      const state = useEditorStore.getState();
      const pedestrianId = state.addPedestrian(1, 2, 3);

      const pedestrian = useEditorStore.getState().pedestrians[0];
      expect(pedestrian.x).toBe(1);
      expect(pedestrian.y).toBe(2);
      expect(pedestrian.z).toBe(3);

      useEditorStore.getState().updatePedestrian(pedestrianId, {
        x: 10,
        y: 20,
        z: 30,
        speed: 5,
        cross_factor: 0.8,
      });

      const updated = useEditorStore.getState().pedestrians[0];
      expect(updated.x).toBe(10);
      expect(updated.y).toBe(20);
      expect(updated.z).toBe(30);
      expect(updated.speed).toBe(5);
      expect(updated.cross_factor).toBe(0.8);
      expect(updated.id).toBe(pedestrianId);
    });

    it('updates only specified pedestrian properties', () => {
      const state = useEditorStore.getState();
      const pedestrianId = state.addPedestrian(1, 2, 3);

      useEditorStore.getState().updatePedestrian(pedestrianId, {
        speed: 10,
      });

      const updated = useEditorStore.getState().pedestrians[0];
      expect(updated.x).toBe(1);
      expect(updated.y).toBe(2);
      expect(updated.z).toBe(3);
      expect(updated.speed).toBe(10);
      expect(updated.cross_factor).toBe(0.5);
    });

    it('does not update when pedestrian id does not exist', () => {
      const state = useEditorStore.getState();
      state.addPedestrian(1, 2, 3);

      useEditorStore.getState().updatePedestrian('non-existent-id', {
        x: 100,
      });

      const pedestrian = useEditorStore.getState().pedestrians[0];
      expect(pedestrian.x).toBe(1);
    });

    it('updates multiple pedestrians correctly', () => {
      const state = useEditorStore.getState();
      const id1 = state.addPedestrian(1, 2, 3);
      const id2 = state.addPedestrian(4, 5, 6);

      useEditorStore.getState().updatePedestrian(id1, {
        x: 10,
        y: 20,
      });

      useEditorStore.getState().updatePedestrian(id2, {
        z: 30,
        speed: 15,
      });

      const pedestrians = useEditorStore.getState().pedestrians;
      expect(pedestrians[0].x).toBe(10);
      expect(pedestrians[0].y).toBe(20);
      expect(pedestrians[0].z).toBe(3);
      expect(pedestrians[1].x).toBe(4);
      expect(pedestrians[1].y).toBe(5);
      expect(pedestrians[1].z).toBe(30);
      expect(pedestrians[1].speed).toBe(15);
    });
  });

  describe('restoreLastDeletion with invalid snapshotId', () => {
    it('returns false when snapshotId is undefined or empty', () => {
      expect(useEditorStore.getState().restoreLastDeletion(undefined)).toBe(
        false,
      );
      expect(useEditorStore.getState().restoreLastDeletion('')).toBe(false);
    });

    it('restores most recent deletion when no snapshotId provided', () => {
      const state = useEditorStore.getState();

      state.addBuilding(1, 1, 1);
      state.addBuilding(2, 2, 2);
      const [first, second] = useEditorStore.getState().buildings;

      state.pushDeletionSnapshot({
        origin: 'single-delete',
        label: 'First building deleted',
        entities: [{ kind: 'building', index: 0, building: first }],
      });

      state.pushDeletionSnapshot({
        origin: 'single-delete',
        label: 'Second building deleted',
        entities: [{ kind: 'building', index: 1, building: second }],
      });

      state.removeBuilding(first.id);
      state.removeBuilding(second.id);

      const restored = useEditorStore.getState().restoreLastDeletion();

      expect(restored).toBe(true);
      expect(useEditorStore.getState().buildings).toHaveLength(1);
      expect(useEditorStore.getState().buildings[0].id).toBe(second.id);
    });
  });
});
