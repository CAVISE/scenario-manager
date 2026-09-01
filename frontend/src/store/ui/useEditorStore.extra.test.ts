import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useEditorStore } from './useEditorStore';
import { act } from '@testing-library/react';
import { DEFAULT_COLOR } from '../../pages/Editor/hooks/useThreeScene/hooks/useOdrMapManager/utils/clearScene/types/clearSceneTypes';

describe('useEditorStore — additional branch coverage', () => {
  beforeEach(() => {
    useEditorStore.setState(useEditorStore.getInitialState(), true);
  });

  it('selectObject sets selectedId and selectedObject', () => {
    const s = useEditorStore.getState();
    const carId = s.addCar(0, 0, 0, 'car', 'ff0000');
    const obj = { id: carId, type: 'car' } as never;
    s.selectObject(obj);
    expect(useEditorStore.getState().selectedId).toBe(carId);
    expect(useEditorStore.getState().selectedObject).toBe(obj);
  });

  it('selectObject with null clears selection', () => {
    useEditorStore.getState().selectObject(null);
    expect(useEditorStore.getState().selectedId).toBeNull();
    expect(useEditorStore.getState().selectedObject).toBeNull();
  });

  it('removeSelectedId clears selectedId and selectedObject', () => {
    const s = useEditorStore.getState();
    const carId = s.addCar(0, 0, 0, 'car', 'ff0000');
    s.selectObject({ id: carId, type: 'car' } as never);
    s.removeSelectedId();
    expect(useEditorStore.getState().selectedId).toBeNull();
    expect(useEditorStore.getState().selectedObject).toBeNull();
  });

  it('removeCar clears selectedId when deleted car was selected', () => {
    const s = useEditorStore.getState();
    const carId = s.addCar(0, 0, 0, 'car', DEFAULT_COLOR);
    s.selectObject({ id: carId, type: 'car' } as never);
    s.removeCar(carId);
    expect(useEditorStore.getState().selectedId).toBeNull();
  });

  it('removeCar keeps selectedId when a different car is selected', () => {
    const s = useEditorStore.getState();
    const carId1 = s.addCar(0, 0, 0, 'car', DEFAULT_COLOR);
    const carId2 = s.addCar(1, 1, 1, 'car', DEFAULT_COLOR);
    s.selectObject({ id: carId2, type: 'car' } as never);
    s.removeCar(carId1);
    expect(useEditorStore.getState().selectedId).toBe(carId2);
  });

  it('setBuildingMode true clears selectedId', () => {
    const s = useEditorStore.getState();
    const carId = s.addCar(0, 0, 0, 'car', DEFAULT_COLOR);
    s.selectObject({ id: carId, type: 'car' } as never);
    s.setBuildingMode(true);
    expect(useEditorStore.getState().isBuildingMode).toBe(true);
    expect(useEditorStore.getState().selectedId).toBeNull();
  });

  it('setBuildingMode false does not clear selectedId', () => {
    const s = useEditorStore.getState();
    const carId = s.addCar(0, 0, 0, 'car', DEFAULT_COLOR);
    s.selectObject({ id: carId, type: 'car' } as never);
    s.setBuildingMode(false);
    expect(useEditorStore.getState().isBuildingMode).toBe(false);
    expect(useEditorStore.getState().selectedId).toBe(carId);
  });

  it('addRSU and removeRSU by index', () => {
    const s = useEditorStore.getState();
    s.addRSU(1, 2, 3);
    s.addRSU(4, 5, 6);
    expect(useEditorStore.getState().RSUs).toHaveLength(2);
    useEditorStore.getState().removeRSU(0);
    expect(useEditorStore.getState().RSUs).toHaveLength(1);
  });

  it('updateRSU updates matching RSU', () => {
    const s = useEditorStore.getState();
    s.addRSU(0, 0, 0);
    const rsu = useEditorStore.getState().RSUs[0];
    s.updateRSU(rsu.id, { tx_power: 50 });
    expect(useEditorStore.getState().RSUs[0].tx_power).toBe(50);
  });

  it('addPedestrian adds with defaults', () => {
    const s = useEditorStore.getState();
    const id = s.addPedestrian(1, 2, 3);
    const peds = useEditorStore.getState().pedestrians;
    expect(peds).toHaveLength(1);
    expect(peds[0].id).toBe(id);
    expect(peds[0].speed).toBe(1.2);
  });

  it('updatePedestrian updates matching pedestrian', () => {
    const s = useEditorStore.getState();
    const id = s.addPedestrian(0, 0, 0);
    s.updatePedestrian(id, { speed: 2.5 });
    expect(useEditorStore.getState().pedestrians[0].speed).toBe(2.5);
  });

  it('removePedestrian removes by id', () => {
    const s = useEditorStore.getState();
    const id = s.addPedestrian(0, 0, 0);
    s.removePedestrian(id);
    expect(useEditorStore.getState().pedestrians).toHaveLength(0);
  });

  it('addBuilding adds with defaults', () => {
    const s = useEditorStore.getState();
    s.addBuilding(1, 2, 3);
    const buildings = useEditorStore.getState().buildings;
    expect(buildings).toHaveLength(1);
    expect(buildings[0].material).toBe('concrete');
  });

  it('updateBuilding updates matching building', () => {
    const s = useEditorStore.getState();
    s.addBuilding(0, 0, 0);
    const b = useEditorStore.getState().buildings[0];
    s.updateBuilding(b.id, { height: 99 });
    expect(useEditorStore.getState().buildings[0].height).toBe(99);
  });

  it('removeBuilding removes by id', () => {
    const s = useEditorStore.getState();
    s.addBuilding(0, 0, 0);
    const b = useEditorStore.getState().buildings[0];
    s.removeBuilding(b.id);
    expect(useEditorStore.getState().buildings).toHaveLength(0);
  });

  it('updateLidar updates matching lidar', () => {
    const s = useEditorStore.getState();
    const carId = s.addCar(0, 0, 0, 'car', DEFAULT_COLOR);
    const lidarId = s.addLidar(carId, 0, 0, 0);
    s.updateLidar(lidarId, { range: 100 });
    expect(useEditorStore.getState().lidars[0].range).toBe(100);
  });

  it('removeLidar removes by id', () => {
    const s = useEditorStore.getState();
    const carId = s.addCar(0, 0, 0, 'car', DEFAULT_COLOR);
    const lidarId = s.addLidar(carId, 0, 0, 0);
    s.removeLidar(lidarId);
    expect(useEditorStore.getState().lidars).toHaveLength(0);
  });

  it('removeLidarsByCarId removes all lidars for a car', () => {
    const s = useEditorStore.getState();
    const carId = s.addCar(0, 0, 0, 'car', DEFAULT_COLOR);
    s.addLidar(carId, 0, 0, 0);
    s.addLidar(carId, 1, 1, 1);
    s.removeLidarsByCarId(carId);
    expect(useEditorStore.getState().lidars).toHaveLength(0);
  });

  it('updatePoint updates matching point', () => {
    const s = useEditorStore.getState();
    const carId = s.addCar(0, 0, 0, 'car', DEFAULT_COLOR);
    s.addPoint(carId, 1, 2, 3);
    const pt = useEditorStore.getState().points[0];
    s.updatePoint(pt.id, { x: 99 });
    expect(useEditorStore.getState().points[0].x).toBe(99);
  });

  it('removePoint removes by id', () => {
    const s = useEditorStore.getState();
    const carId = s.addCar(0, 0, 0, 'car', DEFAULT_COLOR);
    s.addPoint(carId, 1, 2, 3);
    const pt = useEditorStore.getState().points[0];
    s.removePoint(pt.id);
    expect(useEditorStore.getState().points).toHaveLength(0);
  });

  it('removePointsByCarId removes all points for a car', () => {
    const s = useEditorStore.getState();
    const carId = s.addCar(0, 0, 0, 'car', DEFAULT_COLOR);
    s.addPoint(carId, 1, 2, 3);
    s.addPoint(carId, 4, 5, 6);
    s.removePointsByCarId(carId);
    expect(useEditorStore.getState().points).toHaveLength(0);
  });

  it('setError sets error state', () => {
    useEditorStore.getState().setError(new Error('something failed'));
    expect(useEditorStore.getState().error).toStrictEqual(
      new Error('something failed')
    );
    useEditorStore.getState().setError(null);
    expect(useEditorStore.getState().error).toBeNull();
  });

  it('updateSimConfigOmnet merges omnet section', () => {
    useEditorStore.getState().updateSimConfigOmnet({ tx_power: 120 });
    expect(useEditorStore.getState().simConfig.omnet.tx_power).toBe(120);
  });

  it('updateSimConfigArtery merges artery section', () => {
    useEditorStore.getState().updateSimConfigArtery({ sumo_step_length: 60 });
    expect(useEditorStore.getState().simConfig.artery.sumo_step_length).toBe(
      60
    );
  });

  it('updateSimConfigSionna merges sionna section', () => {
    useEditorStore.getState().updateSimConfigSionna({ max_depth: 5 });
    expect(useEditorStore.getState().simConfig.sionna.max_depth).toBe(5);
  });

  it('updateSimConfigMPC merges mpc section', () => {
    useEditorStore.getState().updateSimConfigMPC({ horizon: 10 } as never);
    expect(
      (useEditorStore.getState().simConfig.mpc as Record<string, unknown>)
        .horizon
    ).toBe(10);
  });
  describe('persist merge', () => {
    it('returns current state when persisted is undefined', () => {
      const { merge } = (
        useEditorStore as {
          persist: {
            getOptions: () => {
              merge: (persisted: unknown, current: unknown) => unknown;
            };
          };
        }
      ).persist.getOptions();
      const current = useEditorStore.getState();
      const result = merge(undefined, current);
      expect(result).toStrictEqual(current);
    });
  });
  describe('persist merge', () => {
    it('merges persisted state into current state', async () => {
      const persisted = {
        cars: [
          {
            id: 'car-1',
            x: 1,
            y: 2,
            z: 3,
            model: 'sedan',
            color: 'red',
            scale: 1,
            rotation: 0,
            speed: 50,
          },
        ],
        RSUs: [],
        lidars: [],
        points: [],
        buildings: [],
        pedestrians: [],
        selectedId: null,
        selectedObject: null,
        Scenario: {
          id: '1',
          name: 'Test',
          weather: 'ClearNoon',
          description: '',
        },
        simConfig: undefined,
      };

      localStorage.setItem(
        'editor-scenario-cache',
        JSON.stringify({ state: persisted, version: 0 })
      );

      const { useEditorStore: freshStore } = await import('./useEditorStore');
      await freshStore.persist.rehydrate();

      expect(freshStore.getState().cars[0].id).toBe('car-1');
    });

    it('restores route visualization when migrating the legacy cache', async () => {
      vi.resetModules();
      localStorage.setItem(
        'editor-scenario-cache',
        JSON.stringify({
          state: {
            simConfig: {
              opencda: {
                local_planner: {
                  debug: false,
                  debug_trajectory: false,
                },
              },
            },
          },
          version: 0,
        })
      );

      const { useEditorStore: freshStore } = await import('./useEditorStore');
      await freshStore.persist.rehydrate();

      expect(freshStore.getState().simConfig.opencda.local_planner.debug).toBe(
        true
      );
      expect(
        freshStore.getState().simConfig.opencda.local_planner.debug_trajectory
      ).toBe(true);
    });
  });
  describe('branch coverage: no-op updates with non-existent id', () => {
    it('updateCar with wrong id leaves cars unchanged', () => {
      act(() => useEditorStore.getState().addCar(0, 0, 0, 'sedan', 'red'));
      act(() => useEditorStore.getState().updateCar('wrong-id', { speed: 99 }));
      expect(useEditorStore.getState().cars[0].speed).toBe(50);
    });

    it('updateRSU with wrong id leaves RSUs unchanged', () => {
      act(() => useEditorStore.getState().addRSU(0, 0, 0));
      act(() =>
        useEditorStore.getState().updateRSU('wrong-id', { tx_power: 99 })
      );
      expect(useEditorStore.getState().RSUs[0].tx_power).toBe(23);
    });

    it('updateLidar with wrong id leaves lidars unchanged', () => {
      act(() => useEditorStore.getState().addLidar('car-1', 0, 0, 0));
      act(() =>
        useEditorStore.getState().updateLidar('wrong-id', { range: 999 })
      );
      expect(useEditorStore.getState().lidars[0].range).toBe(50);
    });

    it('updatePoint with wrong id leaves points unchanged', () => {
      act(() => useEditorStore.getState().addPoint('car-1', 1, 2, 3));
      act(() => useEditorStore.getState().updatePoint('wrong-id', { x: 99 }));
      expect(useEditorStore.getState().points[0].x).toBe(1);
    });

    it('updateBuilding with wrong id leaves buildings unchanged', () => {
      act(() => useEditorStore.getState().addBuilding(0, 0, 0));
      act(() =>
        useEditorStore.getState().updateBuilding('wrong-id', { height: 99 })
      );
      expect(useEditorStore.getState().buildings[0].height).toBe(20);
    });
  });
});
