import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useEditorStore } from '@/store';
import { resolveSelection } from '@/store/utils/sceneEntities';
import { createHistoryTracker } from '@editor/hooks/createEvents/createHistoryTracker';
import { applyBatchProperty, deleteSelectedObjects } from './batchActions';
import { getBatchFields } from './batchFields';
import { getSelectedEntities } from '@/store/utils/sceneEntities';

let dispose: (() => void) | undefined;
const select = (ids: string[]) => {
  const state = useEditorStore.getState();
  state.selectObjects(resolveSelection(state, ids));
};
const addCar = (speed = 50) =>
  useEditorStore.getState().addCar(0, 0, 0, 'car', '2563eb', speed);

describe('batch editing and history', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useEditorStore.setState(useEditorStore.getInitialState(), true);
  });
  afterEach(() => {
    dispose?.();
    dispose = undefined;
    vi.useRealTimers();
  });

  it('updates only selected entities and creates one reversible history entry', () => {
    const first = addCar(40),
      second = addCar(60),
      other = addCar(90);
    select([first, second]);
    dispose = createHistoryTracker({ getIsDragging: () => false });
    expect(applyBatchProperty('speed', '75')).toBe(true);
    expect(useEditorStore.getState().cars.map((car) => car.speed)).toEqual([
      75, 75, 90,
    ]);
    vi.advanceTimersByTime(1000);
    expect(useEditorStore.getState().historyStack).toHaveLength(1);
    useEditorStore.getState().undo();
    expect(useEditorStore.getState().cars.map((car) => car.speed)).toEqual([
      40, 60, 90,
    ]);
    useEditorStore.getState().redo();
    expect(
      useEditorStore.getState().cars.find((car) => car.id === other)?.speed
    ).toBe(90);
    expect(
      useEditorStore
        .getState()
        .cars.slice(0, 2)
        .map((car) => car.speed)
    ).toEqual([75, 75]);
  });

  it('flushes a pending individual edit before recording the batch operation', () => {
    const first = addCar(40),
      second = addCar(60);
    dispose = createHistoryTracker({ getIsDragging: () => false });
    useEditorStore.getState().updateCar(first, { speed: 45 });
    select([first, second]);
    applyBatchProperty('speed', '80');
    expect(useEditorStore.getState().historyStack).toHaveLength(2);
    useEditorStore.getState().undo();
    expect(useEditorStore.getState().cars.map((car) => car.speed)).toEqual([
      45, 60,
    ]);
    useEditorStore.getState().undo();
    expect(useEditorStore.getState().cars.map((car) => car.speed)).toEqual([
      40, 60,
    ]);
  });

  it('rejects incompatible types, invalid values, and sensor/world coordinate mixtures', () => {
    const car = addCar();
    const ped = useEditorStore.getState().addPedestrian(3, 4, 0);
    select([car, ped]);
    expect(
      getBatchFields(getSelectedEntities(useEditorStore.getState())).map(
        (field) => field.key
      )
    ).toEqual(['x', 'y', 'z']);
    expect(applyBatchProperty('speed', '70')).toBe(false);
    expect(applyBatchProperty('x', '')).toBe(false);
    expect(applyBatchProperty('x', 'Infinity')).toBe(false);
    expect(applyBatchProperty('x', '12')).toBe(true);
    const lidar = useEditorStore.getState().addLidar(car, 0, 0, 1);
    select([car, lidar]);
    expect(applyBatchProperty('x', '5')).toBe(false);
    select([car]);
    expect(applyBatchProperty('speed', '-1')).toBe(false);
    expect(applyBatchProperty('color', '#ab12ff')).toBe(true);
    expect(useEditorStore.getState().cars[0].color).toBe('ab12ff');
  });

  it('deletes a group with dependent points and sensors and restores it without duplicates', () => {
    const first = addCar(),
      second = addCar(),
      other = addCar();
    const point = useEditorStore.getState().addPoint(first, 10, 20, 0);
    const lidar = useEditorStore.getState().addLidar(first, 0, 0, 2);
    const otherPoint = useEditorStore.getState().addPoint(other, 50, 50, 0);
    select([first, second, point, lidar]);
    expect(deleteSelectedObjects()).toEqual({
      count: 4,
      entryId: expect.any(String),
    });
    expect(useEditorStore.getState().cars.map((car) => car.id)).toEqual([
      other,
    ]);
    expect(useEditorStore.getState().points.map((item) => item.id)).toEqual([
      otherPoint,
    ]);
    expect(useEditorStore.getState().lidars).toEqual([]);
    expect(useEditorStore.getState().selectedIds).toEqual([]);
    useEditorStore.getState().undo();
    expect(useEditorStore.getState().cars.map((car) => car.id)).toEqual([
      first,
      second,
      other,
    ]);
    expect(useEditorStore.getState().points.map((item) => item.id)).toEqual([
      point,
      otherPoint,
    ]);
    expect(useEditorStore.getState().lidars.map((item) => item.id)).toEqual([
      lidar,
    ]);
    useEditorStore.getState().redo();
    useEditorStore.getState().undo();
    expect(useEditorStore.getState().lidars).toHaveLength(1);
    expect(useEditorStore.getState().points).toHaveLength(2);
  });

  it('blocks programmatic batch mutations while a simulation is running', () => {
    const first = addCar(),
      second = addCar();
    select([first, second]);
    useEditorStore.getState().updateSimulationSession({ phase: 'running' });
    expect(applyBatchProperty('speed', '80')).toBe(false);
    expect(deleteSelectedObjects()).toBeNull();
    expect(useEditorStore.getState().cars).toHaveLength(2);
    expect(useEditorStore.getState().historyStack).toHaveLength(0);
  });
});
