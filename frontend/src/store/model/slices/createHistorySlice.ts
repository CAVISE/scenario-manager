import { nanoid } from 'nanoid';
import type { StateCreator } from 'zustand';
import type { EditorState } from '../../types/useEditorStoreTypes';

const MAX_HISTORY_SIZE = 100;

type HistorySlice = Pick<
  EditorState,
  | 'deletionHistory'
  | 'historyStack'
  | 'historyCursor'
  | 'isApplyingHistory'
  | 'pushDeletionSnapshot'
  | 'restoreLastDeletion'
  | 'clearDeletionHistory'
  | 'pushHistoryEntry'
  | 'undo'
  | 'redo'
  | 'canUndo'
  | 'canRedo'
  | 'clearHistory'
>;

export const createHistorySlice: StateCreator<
  EditorState,
  [],
  [],
  HistorySlice
> = (set, get) => ({
  deletionHistory: [],
  historyStack: [],
  historyCursor: 0,
  isApplyingHistory: false,

  pushDeletionSnapshot: (snapshot) => {
    const snapshotId = nanoid();
    set((state) => ({
      deletionHistory: [
        ...state.deletionHistory,
        { ...snapshot, snapshotId, deletedAt: Date.now() },
      ],
    }));
    return snapshotId;
  },
  restoreLastDeletion: (snapshotId) => {
    const state = get();
    if (state.deletionHistory.length === 0) return false;

    const targetIndex = snapshotId
      ? state.deletionHistory.findIndex(
          (snapshot) => snapshot.snapshotId === snapshotId
        )
      : state.deletionHistory.length - 1;
    if (targetIndex === -1) return false;

    const snapshot = state.deletionHistory[targetIndex];
    set((current) => {
      const cars = [...current.cars];
      const RSUs = [...current.RSUs];
      const buildings = [...current.buildings];
      const pedestrians = [...current.pedestrians];
      const lidars = [...current.lidars];
      const points = [...current.points];
      const insertAt = (items: unknown[], index: number) =>
        Math.min(Math.max(index, 0), items.length);

      for (const entity of snapshot.entities) {
        switch (entity.kind) {
          case 'car':
            cars.splice(insertAt(cars, entity.index), 0, entity.car);
            points.push(...entity.points);
            lidars.push(...entity.lidars);
            break;
          case 'rsu':
            RSUs.splice(insertAt(RSUs, entity.index), 0, entity.rsu);
            break;
          case 'building':
            buildings.splice(
              insertAt(buildings, entity.index),
              0,
              entity.building
            );
            break;
          case 'pedestrian':
            pedestrians.splice(
              insertAt(pedestrians, entity.index),
              0,
              entity.pedestrian
            );
            break;
          case 'lidar':
            lidars.splice(insertAt(lidars, entity.index), 0, entity.lidar);
            break;
          case 'point':
            points.splice(insertAt(points, entity.index), 0, entity.point);
            break;
        }
      }

      const historyIndex = current.historyStack.findIndex(
        (entry) => entry.sourceSnapshotId === snapshot.snapshotId
      );
      const historyStack =
        historyIndex === -1
          ? current.historyStack
          : [
              ...current.historyStack.slice(0, historyIndex),
              ...current.historyStack.slice(historyIndex + 1),
            ];
      const historyCursor =
        historyIndex === -1
          ? current.historyCursor
          : historyIndex < current.historyCursor
            ? current.historyCursor - 1
            : current.historyCursor;

      return {
        cars,
        RSUs,
        buildings,
        pedestrians,
        lidars,
        points,
        deletionHistory: current.deletionHistory.filter(
          (item) => item.snapshotId !== snapshot.snapshotId
        ),
        historyStack,
        historyCursor,
      };
    });
    return true;
  },
  clearDeletionHistory: () => set({ deletionHistory: [] }),

  pushHistoryEntry: (entry) => {
    const id = nanoid();
    set((state) => {
      const base = state.historyStack.slice(0, state.historyCursor);
      const next = [...base, { ...entry, id, timestamp: Date.now() }];
      const overflow = next.length - MAX_HISTORY_SIZE;
      const trimmed = overflow > 0 ? next.slice(overflow) : next;
      return { historyStack: trimmed, historyCursor: trimmed.length };
    });
    return id;
  },
  undo: () => {
    const state = get();
    if (state.historyCursor === 0) return false;
    const entryIndex = state.historyCursor - 1;
    const entry = state.historyStack[entryIndex];

    set({ isApplyingHistory: true });
    try {
      entry.undo();
    } finally {
      set({ isApplyingHistory: false });
    }

    if (get().historyStack[entryIndex]?.id === entry.id) {
      set({ historyCursor: entryIndex });
    }
    return true;
  },
  redo: () => {
    const state = get();
    if (state.historyCursor >= state.historyStack.length) return false;
    const entryIndex = state.historyCursor;
    const entry = state.historyStack[entryIndex];

    set({ isApplyingHistory: true });
    try {
      entry.redo();
    } finally {
      set({ isApplyingHistory: false });
    }

    if (get().historyStack[entryIndex]?.id === entry.id) {
      set({ historyCursor: entryIndex + 1 });
    }
    return true;
  },
  canUndo: () => get().historyCursor > 0,
  canRedo: () => get().historyCursor < get().historyStack.length,
  clearHistory: () => set({ historyStack: [], historyCursor: 0 }),
});
