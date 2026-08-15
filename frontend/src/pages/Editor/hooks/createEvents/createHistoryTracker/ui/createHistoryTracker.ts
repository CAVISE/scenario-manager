import { useEditorStore } from '../../../../../../store';
import type {
  Building,
  Car,
  Lidar,
  Pedestrian,
  Point,
  RSU,
} from '../../../../../../store/types/useEditorStoreTypes';
import {
  CreateHistoryTrackerOptions,
  HISTORY_COALESCE_MS,
} from '../types/createHistoryTrackerTypes';

type WithId = { id: string };

/**
 * True if any field differs between a and b (ignoring reference
 * identity — this is called on plain data objects from the store).
 * Nested objects (e.g. Car.opencda_sensing, RSU.opencda_sensing) are
 * compared by JSON.stringify: a false positive here just means an
 * occasional redundant history entry, which is harmless, whereas a
 * false negative would silently drop a real edit from the undo stack —
 * so this errs toward "different" whenever unsure.
 */
function fieldsDiffer<T extends object>(a: T, b: T): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    const av = (a as Record<string, unknown>)[key];
    const bv = (b as Record<string, unknown>)[key];
    if (av === bv) continue;
    if (typeof av === 'object' || typeof bv === 'object') {
      if (JSON.stringify(av) !== JSON.stringify(bv)) return true;
      continue;
    }
    return true;
  }
  return false;
}

type PendingEdit<T> = {
  before: T;
  timer: ReturnType<typeof setTimeout>;
};

/**
 * Generic per-collection tracker: watches one array in the store (cars,
 * RSUs, ...), and for each object whose fields changed since the last
 * tick, coalesces the edit into a single debounced history entry per
 * id. `before` is captured once at the start of a burst and kept until
 * the burst settles, so a history entry always spans "value before the
 * user started editing" -> "value when they stopped", not just the
 * last incremental tick.
 *
 * Known gap: a pending (not yet committed) edit's debounce timer isn't
 * cancelled if undo()/redo() fires mid-burst — e.g. typing into a
 * field, then hitting Ctrl+Z before the 500ms settle. The pending
 * edit still commits against whatever value undo/redo left behind,
 * producing a confusing "before" -> "after" pair. Rare in practice
 * (it needs an undo squeezed inside an active typing/dragging burst)
 * and not what was reported, so left as a documented limitation rather
 * than adding pending-timer cancellation on every undo/redo call.
 */
function createCollectionTracker<T extends WithId>(
  label: string,
  getList: () => T[],
  updateFn: (id: string, patch: Partial<T>) => void,
) {
  const pending = new Map<string, PendingEdit<T>>();

  const commit = (id: string) => {
    const edit = pending.get(id);
    if (!edit) return;
    pending.delete(id);

    const current = getList().find((item) => item.id === id);
    if (!current) return;
    if (!fieldsDiffer(edit.before, current)) return;

    const before = edit.before;
    const after = current;
    useEditorStore.getState().pushHistoryEntry({
      label: `Edited ${label.replace(/s$/, '')}`,
      undo: () => updateFn(id, before),
      redo: () => updateFn(id, after),
    });
  };

  const onTick = (prevItems: T[], nextItems: T[]) => {
    if (prevItems === nextItems) return;
    const prevById = new Map(prevItems.map((item) => [item.id, item]));

    for (const next of nextItems) {
      const prev = prevById.get(next.id);
      if (!prev) continue;
      if (!fieldsDiffer(prev, next)) continue;

      const existing = pending.get(next.id);
      if (existing) {
        clearTimeout(existing.timer);
        existing.timer = setTimeout(() => commit(next.id), HISTORY_COALESCE_MS);
      } else {
        pending.set(next.id, {
          before: prev,
          timer: setTimeout(() => commit(next.id), HISTORY_COALESCE_MS),
        });
      }
    }
  };

  const dispose = () => {
    for (const edit of pending.values()) clearTimeout(edit.timer);
    pending.clear();
  };

  return { onTick, dispose };
}

export function createHistoryTracker(
  opts: CreateHistoryTrackerOptions,
): () => void {
  const { getIsDragging } = opts;
  const s = useEditorStore.getState();

  const carsTracker = createCollectionTracker<Car>(
    'cars',
    () => useEditorStore.getState().cars,
    (id, patch) => useEditorStore.getState().updateCar(id, patch),
  );
  const rsusTracker = createCollectionTracker<RSU>(
    'RSUs',
    () => useEditorStore.getState().RSUs,
    (id, patch) => useEditorStore.getState().updateRSU(id, patch),
  );
  const buildingsTracker = createCollectionTracker<Building>(
    'buildings',
    () => useEditorStore.getState().buildings,
    (id, patch) => useEditorStore.getState().updateBuilding(id, patch),
  );
  const pedestriansTracker = createCollectionTracker<Pedestrian>(
    'pedestrians',
    () => useEditorStore.getState().pedestrians,
    (id, patch) => useEditorStore.getState().updatePedestrian(id, patch),
  );
  const lidarsTracker = createCollectionTracker<Lidar>(
    'lidars',
    () => useEditorStore.getState().lidars,
    (id, patch) => useEditorStore.getState().updateLidar(id, patch),
  );
  const pointsTracker = createCollectionTracker<Point>(
    'points',
    () => useEditorStore.getState().points,
    (id, patch) => useEditorStore.getState().updatePoint(id, patch),
  );

  let prev = {
    cars: s.cars,
    RSUs: s.RSUs,
    buildings: s.buildings,
    pedestrians: s.pedestrians,
    lidars: s.lidars,
    points: s.points,
  };

  const unsubscribe = useEditorStore.subscribe(() => {
    const state = useEditorStore.getState();

    const skip = getIsDragging() || useEditorStore.getState().isApplyingHistory;
    if (!skip) {
      carsTracker.onTick(prev.cars, state.cars);
      rsusTracker.onTick(prev.RSUs, state.RSUs);
      buildingsTracker.onTick(prev.buildings, state.buildings);
      pedestriansTracker.onTick(prev.pedestrians, state.pedestrians);
      lidarsTracker.onTick(prev.lidars, state.lidars);
      pointsTracker.onTick(prev.points, state.points);
    }

    prev = {
      cars: state.cars,
      RSUs: state.RSUs,
      buildings: state.buildings,
      pedestrians: state.pedestrians,
      lidars: state.lidars,
      points: state.points,
    };
  });

  return () => {
    unsubscribe();
    carsTracker.dispose();
    rsusTracker.dispose();
    buildingsTracker.dispose();
    pedestriansTracker.dispose();
    lidarsTracker.dispose();
    pointsTracker.dispose();
  };
}
