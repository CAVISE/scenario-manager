import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useEditorStore } from './useEditorStore';
import { DEFAULT_COLOR } from '@editor/hooks/useThreeScene/hooks/useOdrMapManager/utils/clearScene/types/clearSceneTypes';

describe('deletion history (undo-restore)', () => {
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

  it('starts with an empty deletion history', () => {
    expect(useEditorStore.getState().deletionHistory).toEqual([]);
  });

  describe('single-object restore', () => {
    it('restores a deleted car along with its linked points and lidars', () => {
      const state = useEditorStore.getState();
      const carId = state.addCar(1, 2, 3, 'car', DEFAULT_COLOR);
      state.addPoint(carId, 10, 11, 12);
      state.addLidar(carId, 4, 5, 6);

      const carIndex = useEditorStore
        .getState()
        .cars.findIndex((c) => c.id === carId);

      const snapshotId = useEditorStore.getState().pushDeletionSnapshot({
        origin: 'single-delete',
        label: 'Car deleted',
        entities: [
          {
            kind: 'car',
            index: carIndex,
            car: useEditorStore.getState().cars[carIndex],
            points: useEditorStore
              .getState()
              .points.filter((p) => p.carId === carId),
            lidars: useEditorStore
              .getState()
              .lidars.filter((l) => l.carId === carId),
          },
        ],
      });

      useEditorStore.getState().removeCar(carId);
      expect(useEditorStore.getState().cars).toHaveLength(0);
      expect(useEditorStore.getState().points).toHaveLength(0);
      expect(useEditorStore.getState().lidars).toHaveLength(0);

      const restored = useEditorStore
        .getState()
        .restoreLastDeletion(snapshotId);

      expect(restored).toBe(true);
      expect(useEditorStore.getState().cars).toHaveLength(1);
      expect(useEditorStore.getState().cars[0].id).toBe(carId);
      expect(useEditorStore.getState().points).toHaveLength(1);
      expect(useEditorStore.getState().points[0].carId).toBe(carId);
      expect(useEditorStore.getState().lidars).toHaveLength(1);
      expect(useEditorStore.getState().lidars[0].carId).toBe(carId);
      expect(useEditorStore.getState().deletionHistory).toHaveLength(0);
    });

    it('restores a deleted RSU at its original index among surviving RSUs', () => {
      const state = useEditorStore.getState();
      state.addRSU(0, 0, 0);
      state.addRSU(1, 1, 1);
      state.addRSU(2, 2, 2);

      const rsus = useEditorStore.getState().RSUs;
      const middleId = rsus[1].id;

      const snapshotId = useEditorStore.getState().pushDeletionSnapshot({
        origin: 'single-delete',
        label: 'RSU deleted',
        entities: [{ kind: 'rsu', index: 1, rsu: rsus[1] }],
      });

      useEditorStore.getState().removeRSU(1);
      expect(useEditorStore.getState().RSUs).toHaveLength(2);
      expect(
        useEditorStore.getState().RSUs.some((r) => r.id === middleId),
      ).toBe(false);

      const restored = useEditorStore
        .getState()
        .restoreLastDeletion(snapshotId);

      expect(restored).toBe(true);
      const restoredRsus = useEditorStore.getState().RSUs;
      expect(restoredRsus).toHaveLength(3);
      expect(restoredRsus[1].id).toBe(middleId);
    });

    it('restores a deleted building', () => {
      const state = useEditorStore.getState();
      state.addBuilding(5, 5, 5);
      const building = useEditorStore.getState().buildings[0];

      const snapshotId = useEditorStore.getState().pushDeletionSnapshot({
        origin: 'single-delete',
        label: 'Building deleted',
        entities: [{ kind: 'building', index: 0, building }],
      });

      useEditorStore.getState().removeBuilding(building.id);
      expect(useEditorStore.getState().buildings).toHaveLength(0);

      const restored = useEditorStore
        .getState()
        .restoreLastDeletion(snapshotId);

      expect(restored).toBe(true);
      expect(useEditorStore.getState().buildings).toHaveLength(1);
      expect(useEditorStore.getState().buildings[0].id).toBe(building.id);
    });

    it('restores a deleted pedestrian', () => {
      const state = useEditorStore.getState();
      const pedestrianId = state.addPedestrian(0, 0, 0);
      const pedestrian = useEditorStore.getState().pedestrians[0];

      const snapshotId = useEditorStore.getState().pushDeletionSnapshot({
        origin: 'single-delete',
        label: 'Pedestrian deleted',
        entities: [{ kind: 'pedestrian', index: 0, pedestrian }],
      });

      useEditorStore.getState().removePedestrian(pedestrianId);
      expect(useEditorStore.getState().pedestrians).toHaveLength(0);

      const restored = useEditorStore
        .getState()
        .restoreLastDeletion(snapshotId);

      expect(restored).toBe(true);
      expect(useEditorStore.getState().pedestrians).toHaveLength(1);
      expect(useEditorStore.getState().pedestrians[0].id).toBe(pedestrianId);
    });
  });

  describe('clear-scene restore', () => {
    it('restores every object type removed by clearing the scene, as one grouped snapshot', () => {
      const state = useEditorStore.getState();
      const carId = state.addCar(1, 2, 3, 'car', DEFAULT_COLOR);
      state.addPoint(carId, 10, 11, 12);
      state.addLidar(carId, 4, 5, 6);
      state.addRSU(0, 0, 0);
      state.addBuilding(5, 5, 5);
      state.addPedestrian(9, 9, 9);

      const s = useEditorStore.getState();
      const entities = [
        {
          kind: 'car' as const,
          index: 0,
          car: s.cars[0],
          points: s.points.filter((p) => p.carId === carId),
          lidars: s.lidars.filter((l) => l.carId === carId),
        },
        { kind: 'rsu' as const, index: 0, rsu: s.RSUs[0] },
        { kind: 'building' as const, index: 0, building: s.buildings[0] },
        {
          kind: 'pedestrian' as const,
          index: 0,
          pedestrian: s.pedestrians[0],
        },
      ];

      const snapshotId = s.pushDeletionSnapshot({
        origin: 'clear-scene',
        label: 'Scene cleared (4 objects)',
        entities,
      });

      [...useEditorStore.getState().cars].forEach((c) =>
        useEditorStore.getState().removeCar(c.id),
      );
      [...useEditorStore.getState().RSUs].forEach(() =>
        useEditorStore.getState().removeRSU(0),
      );
      [...useEditorStore.getState().buildings].forEach((b) =>
        useEditorStore.getState().removeBuilding(b.id),
      );
      [...useEditorStore.getState().pedestrians].forEach((p) =>
        useEditorStore.getState().removePedestrian(p.id),
      );

      expect(useEditorStore.getState().cars).toHaveLength(0);
      expect(useEditorStore.getState().RSUs).toHaveLength(0);
      expect(useEditorStore.getState().buildings).toHaveLength(0);
      expect(useEditorStore.getState().pedestrians).toHaveLength(0);
      expect(useEditorStore.getState().points).toHaveLength(0);
      expect(useEditorStore.getState().lidars).toHaveLength(0);

      const restored = useEditorStore
        .getState()
        .restoreLastDeletion(snapshotId);

      expect(restored).toBe(true);
      expect(useEditorStore.getState().cars).toHaveLength(1);
      expect(useEditorStore.getState().RSUs).toHaveLength(1);
      expect(useEditorStore.getState().buildings).toHaveLength(1);
      expect(useEditorStore.getState().pedestrians).toHaveLength(1);
      expect(useEditorStore.getState().points).toHaveLength(1);
      expect(useEditorStore.getState().lidars).toHaveLength(1);
      expect(useEditorStore.getState().deletionHistory).toHaveLength(0);
    });
  });

  describe('history stack behavior', () => {
    it('accumulates multiple snapshots without a cap', () => {
      const state = useEditorStore.getState();
      for (let i = 0; i < 25; i++) {
        state.addBuilding(i, i, i);
      }
      const buildings = useEditorStore.getState().buildings;

      buildings.forEach((building, index) => {
        useEditorStore.getState().pushDeletionSnapshot({
          origin: 'single-delete',
          label: `Building ${index} deleted`,
          entities: [{ kind: 'building', index, building }],
        });
      });

      expect(useEditorStore.getState().deletionHistory).toHaveLength(25);
    });

    it('restores the most recently pushed snapshot by default when no id is given', () => {
      const state = useEditorStore.getState();
      state.addBuilding(1, 1, 1);
      state.addBuilding(2, 2, 2);
      const [first, second] = useEditorStore.getState().buildings;

      state.pushDeletionSnapshot({
        origin: 'single-delete',
        label: 'First deleted',
        entities: [{ kind: 'building', index: 0, building: first }],
      });
      state.pushDeletionSnapshot({
        origin: 'single-delete',
        label: 'Second deleted',
        entities: [{ kind: 'building', index: 1, building: second }],
      });

      state.removeBuilding(first.id);
      state.removeBuilding(second.id);
      expect(useEditorStore.getState().buildings).toHaveLength(0);

      const restored = useEditorStore.getState().restoreLastDeletion();

      expect(restored).toBe(true);
      const remaining = useEditorStore.getState().buildings;
      expect(remaining).toHaveLength(1);
      expect(remaining[0].id).toBe(second.id);
      expect(useEditorStore.getState().deletionHistory).toHaveLength(1);
    });

    it('returns false and leaves state untouched when the history is empty', () => {
      const restored = useEditorStore.getState().restoreLastDeletion();
      expect(restored).toBe(false);
    });

    it('returns false when restoring an id that is no longer in history (already restored / stale toast)', () => {
      const state = useEditorStore.getState();
      state.addBuilding(1, 1, 1);
      const building = useEditorStore.getState().buildings[0];

      const snapshotId = state.pushDeletionSnapshot({
        origin: 'single-delete',
        label: 'Building deleted',
        entities: [{ kind: 'building', index: 0, building }],
      });
      state.removeBuilding(building.id);

      const firstRestore = useEditorStore
        .getState()
        .restoreLastDeletion(snapshotId);
      expect(firstRestore).toBe(true);

      const secondRestore = useEditorStore
        .getState()
        .restoreLastDeletion(snapshotId);
      expect(secondRestore).toBe(false);
      expect(useEditorStore.getState().buildings).toHaveLength(1);
    });

    it('clearDeletionHistory empties the stack without touching scene objects', () => {
      const state = useEditorStore.getState();
      state.addBuilding(1, 1, 1);
      const building = useEditorStore.getState().buildings[0];

      state.pushDeletionSnapshot({
        origin: 'single-delete',
        label: 'Building deleted',
        entities: [{ kind: 'building', index: 0, building }],
      });
      expect(useEditorStore.getState().deletionHistory).toHaveLength(1);

      useEditorStore.getState().clearDeletionHistory();

      expect(useEditorStore.getState().deletionHistory).toHaveLength(0);

      expect(useEditorStore.getState().buildings).toHaveLength(1);
    });
  });

  describe('index clamping on restore', () => {
    it('clamps an out-of-range index to the end of the array instead of throwing', () => {
      const state = useEditorStore.getState();
      state.addBuilding(1, 1, 1);
      const building = useEditorStore.getState().buildings[0];

      const snapshotId = state.pushDeletionSnapshot({
        origin: 'single-delete',
        label: 'Building deleted',
        entities: [{ kind: 'building', index: 999, building }],
      });
      state.removeBuilding(building.id);

      expect(() =>
        useEditorStore.getState().restoreLastDeletion(snapshotId),
      ).not.toThrow();
      expect(useEditorStore.getState().buildings).toHaveLength(1);
      expect(useEditorStore.getState().buildings[0].id).toBe(building.id);
    });
  });
});

describe('useEditorStore - History', () => {
  beforeEach(() => {
    useEditorStore.setState({
      historyStack: [],
      historyCursor: 0,
      cars: [],
      RSUs: [],
      lidars: [],
      points: [],
      buildings: [],
      pedestrians: [],
      deletionHistory: [],
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

  describe('pushHistoryEntry', () => {
    it('adds a history entry and updates cursor', () => {
      const undo = vi.fn();
      const redo = vi.fn();

      useEditorStore.getState().pushHistoryEntry({
        label: 'Test entry',
        undo,
        redo,
      });

      const state = useEditorStore.getState();
      expect(state.historyStack).toHaveLength(1);
      expect(state.historyCursor).toBe(1);
      expect(state.historyStack[0]).toMatchObject({
        id: expect.any(String),
        timestamp: expect.any(Number),
        label: 'Test entry',
      });
      expect(state.historyStack[0].undo).toBe(undo);
      expect(state.historyStack[0].redo).toBe(redo);
    });

    it('trims history when exceeding MAX_HISTORY_SIZE', () => {
      const MAX_HISTORY_SIZE = 100;
      for (let i = 0; i < MAX_HISTORY_SIZE + 5; i++) {
        useEditorStore.getState().pushHistoryEntry({
          label: `Entry ${i}`,
          undo: vi.fn(),
          redo: vi.fn(),
        });
      }

      const state = useEditorStore.getState();
      expect(state.historyStack).toHaveLength(MAX_HISTORY_SIZE);
      expect(state.historyCursor).toBe(MAX_HISTORY_SIZE);
    });

    it('trims history correctly when cursor is not at the end', () => {
      for (let i = 0; i < 5; i++) {
        useEditorStore.getState().pushHistoryEntry({
          label: `Entry ${i}`,
          undo: vi.fn(),
          redo: vi.fn(),
        });
      }

      expect(useEditorStore.getState().historyStack).toHaveLength(5);
      expect(useEditorStore.getState().historyCursor).toBe(5);

      useEditorStore.getState().undo();
      expect(useEditorStore.getState().historyCursor).toBe(4);

      useEditorStore.getState().pushHistoryEntry({
        label: 'New entry',
        undo: vi.fn(),
        redo: vi.fn(),
      });

      const state = useEditorStore.getState();
      expect(state.historyStack).toHaveLength(5);
      expect(state.historyCursor).toBe(5);
      expect(state.historyStack[state.historyStack.length - 1].label).toBe(
        'New entry',
      );
      expect(state.historyStack.some((e) => e.label === 'Entry 4')).toBe(false);
    });
  });

  describe('undo', () => {
    it('does nothing when historyCursor is 0', () => {
      expect(useEditorStore.getState().canUndo()).toBe(false);
      expect(useEditorStore.getState().undo()).toBe(false);
    });

    it('calls undo on the last entry and moves cursor back', () => {
      const undo = vi.fn();
      const redo = vi.fn();

      useEditorStore
        .getState()
        .pushHistoryEntry({ label: 'Entry 1', undo, redo });

      const undo2 = vi.fn();
      useEditorStore
        .getState()
        .pushHistoryEntry({ label: 'Entry 2', undo: undo2, redo: vi.fn() });

      expect(useEditorStore.getState().historyCursor).toBe(2);

      const result = useEditorStore.getState().undo();

      expect(result).toBe(true);
      expect(undo2).toHaveBeenCalled();
      expect(undo).not.toHaveBeenCalled();
      expect(useEditorStore.getState().historyCursor).toBe(1);
    });

    it('does not move cursor if entry was already undone', () => {
      const customUndo = vi.fn(() => {
        useEditorStore.setState({
          historyStack: [],
          historyCursor: 0,
        });
      });

      useEditorStore.getState().pushHistoryEntry({
        label: 'Test entry',
        undo: customUndo,
        redo: vi.fn(),
      });

      expect(useEditorStore.getState().historyCursor).toBe(1);

      useEditorStore.getState().undo();

      expect(useEditorStore.getState().historyCursor).toBe(0);
      expect(customUndo).toHaveBeenCalled();
    });
  });

  describe('redo', () => {
    it('does nothing when cursor is at the end', () => {
      useEditorStore.getState().pushHistoryEntry({
        label: 'Entry 1',
        undo: vi.fn(),
        redo: vi.fn(),
      });

      expect(useEditorStore.getState().canRedo()).toBe(false);
      expect(useEditorStore.getState().redo()).toBe(false);
    });

    it('calls redo on the next entry and moves cursor forward', () => {
      const redo = vi.fn();
      const undo = vi.fn();

      useEditorStore
        .getState()
        .pushHistoryEntry({ label: 'Entry 1', undo, redo: vi.fn() });

      const redo2 = vi.fn();
      useEditorStore
        .getState()
        .pushHistoryEntry({ label: 'Entry 2', undo: vi.fn(), redo: redo2 });

      expect(useEditorStore.getState().historyCursor).toBe(2);

      useEditorStore.getState().undo();
      expect(useEditorStore.getState().historyCursor).toBe(1);

      const result = useEditorStore.getState().redo();

      expect(result).toBe(true);
      expect(redo2).toHaveBeenCalled();
      expect(redo).not.toHaveBeenCalled();
      expect(useEditorStore.getState().historyCursor).toBe(2);
    });

    it('does not move cursor if entry was already redone', () => {
      const redo = vi.fn();

      useEditorStore
        .getState()
        .pushHistoryEntry({ label: 'Entry 1', undo: vi.fn(), redo: vi.fn() });
      useEditorStore
        .getState()
        .pushHistoryEntry({ label: 'Entry 2', undo: vi.fn(), redo });

      expect(useEditorStore.getState().historyCursor).toBe(2);

      useEditorStore.getState().undo();
      expect(useEditorStore.getState().historyCursor).toBe(1);

      const result = useEditorStore.getState().redo();

      expect(result).toBe(true);
      expect(redo).toHaveBeenCalled();
      expect(useEditorStore.getState().historyCursor).toBe(2);
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
    });

    it('canRedo returns true when cursor < stack length', () => {
      useEditorStore
        .getState()
        .pushHistoryEntry({ label: 'Entry 1', undo: vi.fn(), redo: vi.fn() });
      useEditorStore
        .getState()
        .pushHistoryEntry({ label: 'Entry 2', undo: vi.fn(), redo: vi.fn() });

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
  });

  describe('clearHistory', () => {
    it('clears history stack and resets cursor', () => {
      useEditorStore
        .getState()
        .pushHistoryEntry({ label: 'Entry 1', undo: vi.fn(), redo: vi.fn() });
      useEditorStore
        .getState()
        .pushHistoryEntry({ label: 'Entry 2', undo: vi.fn(), redo: vi.fn() });

      expect(useEditorStore.getState().historyStack).toHaveLength(2);
      expect(useEditorStore.getState().historyCursor).toBe(2);

      useEditorStore.getState().clearHistory();

      expect(useEditorStore.getState().historyStack).toHaveLength(0);
      expect(useEditorStore.getState().historyCursor).toBe(0);
    });
  });

  describe('undo and redo integration', () => {
    it('handles multiple undo/redo operations correctly', () => {
      const undoMock1 = vi.fn();
      const redoMock1 = vi.fn();
      const undoMock2 = vi.fn();
      const redoMock2 = vi.fn();

      useEditorStore.getState().pushHistoryEntry({
        label: 'Entry 1',
        undo: undoMock1,
        redo: redoMock1,
      });
      useEditorStore.getState().pushHistoryEntry({
        label: 'Entry 2',
        undo: undoMock2,
        redo: redoMock2,
      });

      expect(useEditorStore.getState().historyCursor).toBe(2);

      useEditorStore.getState().undo();
      expect(undoMock2).toHaveBeenCalled();
      expect(useEditorStore.getState().historyCursor).toBe(1);

      useEditorStore.getState().undo();
      expect(undoMock1).toHaveBeenCalled();
      expect(useEditorStore.getState().historyCursor).toBe(0);

      useEditorStore.getState().redo();
      expect(redoMock1).toHaveBeenCalled();
      expect(useEditorStore.getState().historyCursor).toBe(1);

      useEditorStore.getState().redo();
      expect(redoMock2).toHaveBeenCalled();
      expect(useEditorStore.getState().historyCursor).toBe(2);

      expect(useEditorStore.getState().redo()).toBe(false);
    });
  });
});

describe('deletion history - restore lidar and point', () => {
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

  describe('restore lidar', () => {
    it('restores a deleted lidar at its original index', () => {
      const state = useEditorStore.getState();

      const carId = state.addCar(1, 2, 3, 'car', DEFAULT_COLOR);

      state.addLidar(carId, 4, 5, 6);
      const lidarId1 = state.addLidar(carId, 7, 8, 9);
      state.addLidar(carId, 10, 11, 12);

      const lidarToDelete = useEditorStore
        .getState()
        .lidars.find((l) => l.id === lidarId1);
      const lidarIndex = useEditorStore
        .getState()
        .lidars.indexOf(lidarToDelete!);

      const snapshotId = useEditorStore.getState().pushDeletionSnapshot({
        origin: 'single-delete',
        label: 'Lidar deleted',
        entities: [
          {
            kind: 'lidar',
            index: lidarIndex,
            lidar: lidarToDelete!,
          },
        ],
      });

      useEditorStore.getState().removeLidar(lidarId1);

      expect(useEditorStore.getState().lidars).toHaveLength(2);
      expect(
        useEditorStore.getState().lidars.some((l) => l.id === lidarId1),
      ).toBe(false);

      const restored = useEditorStore
        .getState()
        .restoreLastDeletion(snapshotId);

      expect(restored).toBe(true);
      const restoredLidars = useEditorStore.getState().lidars;
      expect(restoredLidars).toHaveLength(3);
      expect(restoredLidars[lidarIndex].id).toBe(lidarId1);
      expect(restoredLidars[lidarIndex].carId).toBe(carId);
      expect(useEditorStore.getState().deletionHistory).toHaveLength(0);
    });

    it('restores a lidar when there are other lidars with same carId', () => {
      const state = useEditorStore.getState();
      const carId = state.addCar(1, 2, 3, 'car', DEFAULT_COLOR);

      state.addLidar(carId, 4, 5, 6);
      const lidarId1 = state.addLidar(carId, 7, 8, 9);
      state.addLidar(carId, 10, 11, 12);

      const carId2 = state.addCar(13, 14, 15, 'car', DEFAULT_COLOR);
      state.addLidar(carId2, 16, 17, 18);

      const lidarToDelete = useEditorStore
        .getState()
        .lidars.find((l) => l.id === lidarId1)!;
      const lidarIndex = useEditorStore
        .getState()
        .lidars.indexOf(lidarToDelete);

      const snapshotId = useEditorStore.getState().pushDeletionSnapshot({
        origin: 'single-delete',
        label: 'Lidar deleted',
        entities: [{ kind: 'lidar', index: lidarIndex, lidar: lidarToDelete }],
      });

      useEditorStore.getState().removeLidar(lidarId1);

      expect(useEditorStore.getState().lidars).toHaveLength(3);

      const restored = useEditorStore
        .getState()
        .restoreLastDeletion(snapshotId);

      expect(restored).toBe(true);
      const restoredLidars = useEditorStore.getState().lidars;
      expect(restoredLidars).toHaveLength(4);
      expect(restoredLidars[lidarIndex].id).toBe(lidarId1);
      expect(restoredLidars[lidarIndex].carId).toBe(carId);
    });
  });

  describe('restore point', () => {
    it('restores a deleted point at its original index', () => {
      const state = useEditorStore.getState();
      const carId = state.addCar(1, 2, 3, 'car', DEFAULT_COLOR);

      state.addPoint(carId, 10, 11, 12);
      const pointId1 = state.addPoint(carId, 13, 14, 15);
      state.addPoint(carId, 16, 17, 18);

      const pointToDelete = useEditorStore
        .getState()
        .points.find((p) => p.id === pointId1)!;
      const pointIndex = useEditorStore
        .getState()
        .points.indexOf(pointToDelete);

      const snapshotId = useEditorStore.getState().pushDeletionSnapshot({
        origin: 'single-delete',
        label: 'Point deleted',
        entities: [
          {
            kind: 'point',
            index: pointIndex,
            point: pointToDelete,
          },
        ],
      });

      useEditorStore.getState().removePoint(pointId1);

      expect(useEditorStore.getState().points).toHaveLength(2);
      expect(
        useEditorStore.getState().points.some((p) => p.id === pointId1),
      ).toBe(false);

      const restored = useEditorStore
        .getState()
        .restoreLastDeletion(snapshotId);

      expect(restored).toBe(true);
      const restoredPoints = useEditorStore.getState().points;
      expect(restoredPoints).toHaveLength(3);
      expect(restoredPoints[pointIndex].id).toBe(pointId1);
      expect(restoredPoints[pointIndex].carId).toBe(carId);
      expect(useEditorStore.getState().deletionHistory).toHaveLength(0);
    });

    it('restores a point when there are points from different cars', () => {
      const state = useEditorStore.getState();
      const carId = state.addCar(1, 2, 3, 'car', DEFAULT_COLOR);
      const carId2 = state.addCar(4, 5, 6, 'car', DEFAULT_COLOR);

      state.addPoint(carId, 10, 11, 12);
      const pointId1 = state.addPoint(carId, 13, 14, 15);
      state.addPoint(carId, 16, 17, 18);

      state.addPoint(carId2, 19, 20, 21);
      state.addPoint(carId2, 22, 23, 24);

      const pointToDelete = useEditorStore
        .getState()
        .points.find((p) => p.id === pointId1)!;
      const pointIndex = useEditorStore
        .getState()
        .points.indexOf(pointToDelete);

      const snapshotId = useEditorStore.getState().pushDeletionSnapshot({
        origin: 'single-delete',
        label: 'Point deleted',
        entities: [{ kind: 'point', index: pointIndex, point: pointToDelete }],
      });

      useEditorStore.getState().removePoint(pointId1);

      expect(useEditorStore.getState().points).toHaveLength(4);

      const restored = useEditorStore
        .getState()
        .restoreLastDeletion(snapshotId);

      expect(restored).toBe(true);
      const restoredPoints = useEditorStore.getState().points;
      expect(restoredPoints).toHaveLength(5);
      expect(restoredPoints[pointIndex].id).toBe(pointId1);
      expect(restoredPoints[pointIndex].carId).toBe(carId);
    });
  });

  describe('restore with index clamping', () => {
    it('clamps out-of-range index for lidar', () => {
      const state = useEditorStore.getState();
      const carId = state.addCar(1, 2, 3, 'car', DEFAULT_COLOR);

      const lidarId = state.addLidar(carId, 4, 5, 6);
      const lidar = useEditorStore.getState().lidars[0];

      const snapshotId = state.pushDeletionSnapshot({
        origin: 'single-delete',
        label: 'Lidar with out-of-range index',
        entities: [{ kind: 'lidar', index: 999, lidar }],
      });

      state.removeLidar(lidarId);
      expect(useEditorStore.getState().lidars).toHaveLength(0);

      const restored = useEditorStore
        .getState()
        .restoreLastDeletion(snapshotId);

      expect(restored).toBe(true);
      const restoredLidars = useEditorStore.getState().lidars;
      expect(restoredLidars).toHaveLength(1);
      expect(restoredLidars[0].id).toBe(lidarId);
      expect(restoredLidars[0].carId).toBe(carId);
    });

    it('clamps out-of-range index for point', () => {
      const state = useEditorStore.getState();
      const carId = state.addCar(1, 2, 3, 'car', DEFAULT_COLOR);

      const pointId = state.addPoint(carId, 10, 11, 12);
      const point = useEditorStore.getState().points[0];

      const snapshotId = state.pushDeletionSnapshot({
        origin: 'single-delete',
        label: 'Point with out-of-range index',
        entities: [{ kind: 'point', index: 999, point }],
      });

      state.removePoint(pointId);
      expect(useEditorStore.getState().points).toHaveLength(0);

      const restored = useEditorStore
        .getState()
        .restoreLastDeletion(snapshotId);

      expect(restored).toBe(true);
      const restoredPoints = useEditorStore.getState().points;
      expect(restoredPoints).toHaveLength(1);
      expect(restoredPoints[0].id).toBe(pointId);
      expect(restoredPoints[0].carId).toBe(carId);
    });
  });

  describe('restore lidar and point as part of car deletion', () => {
    it('restores lidars and points when restoring a deleted car', () => {
      const state = useEditorStore.getState();
      const carId = state.addCar(1, 2, 3, 'car', DEFAULT_COLOR);

      const pointId1 = state.addPoint(carId, 10, 11, 12);
      const pointId2 = state.addPoint(carId, 13, 14, 15);

      const lidarId1 = state.addLidar(carId, 4, 5, 6);
      const lidarId2 = state.addLidar(carId, 7, 8, 9);

      const car = useEditorStore.getState().cars[0];
      const points = useEditorStore
        .getState()
        .points.filter((p) => p.carId === carId);
      const lidars = useEditorStore
        .getState()
        .lidars.filter((l) => l.carId === carId);

      const snapshotId = state.pushDeletionSnapshot({
        origin: 'single-delete',
        label: 'Car with lidars and points deleted',
        entities: [
          {
            kind: 'car',
            index: 0,
            car,
            points,
            lidars,
          },
        ],
      });

      state.removeCar(carId);

      expect(useEditorStore.getState().cars).toHaveLength(0);
      expect(useEditorStore.getState().points).toHaveLength(0);
      expect(useEditorStore.getState().lidars).toHaveLength(0);

      const restored = useEditorStore
        .getState()
        .restoreLastDeletion(snapshotId);

      expect(restored).toBe(true);
      expect(useEditorStore.getState().cars).toHaveLength(1);
      expect(useEditorStore.getState().points).toHaveLength(2);
      expect(useEditorStore.getState().lidars).toHaveLength(2);

      const restoredPoints = useEditorStore.getState().points;
      expect(restoredPoints.some((p) => p.id === pointId1)).toBe(true);
      expect(restoredPoints.some((p) => p.id === pointId2)).toBe(true);

      const restoredLidars = useEditorStore.getState().lidars;
      expect(restoredLidars.some((l) => l.id === lidarId1)).toBe(true);
      expect(restoredLidars.some((l) => l.id === lidarId2)).toBe(true);
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

  describe('removeAllRSUs', () => {
    it('removes all RSUs from the store', () => {
      const state = useEditorStore.getState();

      state.addRSU(0, 0, 0);
      state.addRSU(1, 1, 1);
      state.addRSU(2, 2, 2);

      expect(useEditorStore.getState().RSUs).toHaveLength(3);

      useEditorStore.getState().removeAllRSUs();

      expect(useEditorStore.getState().RSUs).toHaveLength(0);
      expect(useEditorStore.getState().RSUs).toEqual([]);
    });

    it('does nothing when there are no RSUs', () => {
      expect(useEditorStore.getState().RSUs).toHaveLength(0);

      useEditorStore.getState().removeAllRSUs();

      expect(useEditorStore.getState().RSUs).toHaveLength(0);
    });

    it('removes all RSUs regardless of other objects', () => {
      const state = useEditorStore.getState();

      state.addRSU(0, 0, 0);
      state.addRSU(1, 1, 1);

      state.addCar(10, 10, 10, 'car', DEFAULT_COLOR);
      state.addBuilding(20, 20, 20);
      state.addPedestrian(30, 30, 30);

      expect(useEditorStore.getState().RSUs).toHaveLength(2);
      expect(useEditorStore.getState().cars).toHaveLength(1);
      expect(useEditorStore.getState().buildings).toHaveLength(1);
      expect(useEditorStore.getState().pedestrians).toHaveLength(1);

      useEditorStore.getState().removeAllRSUs();

      expect(useEditorStore.getState().RSUs).toHaveLength(0);
      expect(useEditorStore.getState().cars).toHaveLength(1);
      expect(useEditorStore.getState().buildings).toHaveLength(1);
      expect(useEditorStore.getState().pedestrians).toHaveLength(1);
    });
  });

  describe('sourceSnapshotId in historyStack', () => {
    it('removes history entries with matching sourceSnapshotId when restoring deletion', () => {
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

      expect(useEditorStore.getState().historyStack).toHaveLength(1);
      expect(useEditorStore.getState().historyStack[0].sourceSnapshotId).toBe(
        snapshotId,
      );

      state.removeBuilding(building.id);

      const restored = useEditorStore
        .getState()
        .restoreLastDeletion(snapshotId);

      expect(restored).toBe(true);
      expect(useEditorStore.getState().historyStack).toHaveLength(0);
    });

    it('keeps history entries with different sourceSnapshotId when restoring deletion', () => {
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

      useEditorStore.getState().pushHistoryEntry({
        label: 'First deletion',
        undo: vi.fn(),
        redo: vi.fn(),
        sourceSnapshotId: snapshotId1,
      });

      useEditorStore.getState().pushHistoryEntry({
        label: 'Second deletion',
        undo: vi.fn(),
        redo: vi.fn(),
        sourceSnapshotId: snapshotId2,
      });

      expect(useEditorStore.getState().historyStack).toHaveLength(2);

      state.removeBuilding(first.id);
      state.removeBuilding(second.id);

      const restored = useEditorStore
        .getState()
        .restoreLastDeletion(snapshotId1);

      expect(restored).toBe(true);

      expect(useEditorStore.getState().historyStack).toHaveLength(1);
      expect(useEditorStore.getState().historyStack[0].sourceSnapshotId).toBe(
        snapshotId2,
      );
    });

    it('handles historyStack with entries without sourceSnapshotId', () => {
      const state = useEditorStore.getState();

      state.addBuilding(1, 1, 1);
      const building = useEditorStore.getState().buildings[0];

      const snapshotId = state.pushDeletionSnapshot({
        origin: 'single-delete',
        label: 'Building deleted',
        entities: [{ kind: 'building', index: 0, building }],
      });

      useEditorStore.getState().pushHistoryEntry({
        label: 'Some other action',
        undo: vi.fn(),
        redo: vi.fn(),
      });

      useEditorStore.getState().pushHistoryEntry({
        label: 'Building deletion',
        undo: vi.fn(),
        redo: vi.fn(),
        sourceSnapshotId: snapshotId,
      });

      expect(useEditorStore.getState().historyStack).toHaveLength(2);

      state.removeBuilding(building.id);

      const restored = useEditorStore
        .getState()
        .restoreLastDeletion(snapshotId);

      expect(restored).toBe(true);

      expect(useEditorStore.getState().historyStack).toHaveLength(1);
      expect(
        useEditorStore.getState().historyStack[0].sourceSnapshotId,
      ).toBeUndefined();
      expect(useEditorStore.getState().historyStack[0].label).toBe(
        'Some other action',
      );
    });

    it('updates historyCursor correctly when removing entry with sourceSnapshotId', () => {
      const state = useEditorStore.getState();

      state.addBuilding(1, 1, 1);
      const building = useEditorStore.getState().buildings[0];

      const snapshotId = state.pushDeletionSnapshot({
        origin: 'single-delete',
        label: 'Building deleted',
        entities: [{ kind: 'building', index: 0, building }],
      });

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

      useEditorStore.getState().pushHistoryEntry({
        label: 'Building deletion',
        undo: vi.fn(),
        redo: vi.fn(),
        sourceSnapshotId: snapshotId,
      });

      expect(useEditorStore.getState().historyCursor).toBe(3);

      state.removeBuilding(building.id);

      const restored = useEditorStore
        .getState()
        .restoreLastDeletion(snapshotId);

      expect(restored).toBe(true);

      expect(useEditorStore.getState().historyStack).toHaveLength(2);
      expect(useEditorStore.getState().historyCursor).toBe(2);
    });
  });

  describe('restoreLastDeletion with sourceSnapshotId', () => {
    it('does not remove history entries when sourceSnapshotId is undefined', () => {
      const state = useEditorStore.getState();

      state.addBuilding(1, 1, 1);
      const building = useEditorStore.getState().buildings[0];

      const snapshotId = state.pushDeletionSnapshot({
        origin: 'single-delete',
        label: 'Building deleted',
        entities: [{ kind: 'building', index: 0, building }],
      });

      useEditorStore.getState().pushHistoryEntry({
        label: 'Some action',
        undo: vi.fn(),
        redo: vi.fn(),
      });

      expect(useEditorStore.getState().historyStack).toHaveLength(1);

      state.removeBuilding(building.id);

      const restored = useEditorStore
        .getState()
        .restoreLastDeletion(snapshotId);

      expect(restored).toBe(true);

      expect(useEditorStore.getState().historyStack).toHaveLength(1);
    });

    it('restores deletion even when no history entries exist', () => {
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
      expect(useEditorStore.getState().buildings).toHaveLength(1);
      expect(useEditorStore.getState().historyStack).toHaveLength(0);
    });
  });
});
