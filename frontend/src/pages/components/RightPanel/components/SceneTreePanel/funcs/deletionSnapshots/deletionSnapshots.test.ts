import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useEditorStore } from '@/store';
import {
  pushClearSceneSnapshot,
  watchHistoryEntryValidity,
} from './ui/deletionSnapshots';

beforeEach(() => {
  useEditorStore.setState(useEditorStore.getInitialState(), true);
});

describe('deletion notifications', () => {
  it('counts each root object when clearing a mixed scene', () => {
    const state = useEditorStore.getState();
    const car = state.addCar(0, 0, 0, 'car', '2563eb');
    state.addPoint(car, 5, 5, 0);
    state.addLidar(car, 0, 0, 2);
    state.addPedestrian(2, 2, 0);
    expect(pushClearSceneSnapshot()?.label).toBe('Scene cleared (2 objects)');
  });

  it.each(['undo', 'another edit'] as const)(
    'invalidates the group deletion action after %s so it cannot undo a different edit',
    (action) => {
      const entryId = useEditorStore.getState().pushHistoryEntry({
        label: 'Delete group',
        undo: vi.fn(),
        redo: vi.fn(),
      });
      const invalidate = vi.fn();
      const unsubscribe = watchHistoryEntryValidity(entryId)(invalidate);
      expect(invalidate).not.toHaveBeenCalled();
      if (action === 'undo') useEditorStore.getState().undo();
      else
        useEditorStore.getState().pushHistoryEntry({
          label: 'Edit vehicle',
          undo: vi.fn(),
          redo: vi.fn(),
        });
      expect(invalidate).toHaveBeenCalled();
      unsubscribe();
    }
  );
});
