import { beforeEach, describe, expect, it } from 'vitest';
import { useEditorStore } from './useEditorStore';
import { DEFAULT_COLOR } from '../pages/editor/hooks/useThreeScene/hooks/useOdrMapManager/clearScene.types';

describe('deletion history (undo-restore)', () => {
  beforeEach(() => {
    useEditorStore.setState(useEditorStore.getInitialState(), true);
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
