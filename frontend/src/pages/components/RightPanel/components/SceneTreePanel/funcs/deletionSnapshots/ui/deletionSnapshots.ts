import { useEditorStore } from '@/store';
import { groupByCarId, getGroupedByCarId } from '@/shared/utils/groupByCarId';
import {
  buildSingleNodeSnapshot,
  DeletionSnapshot,
  type BuildSingleNodeSnapshotProps,
  type PushedSnapshotInfo,
} from '../types/deletionSnapshotsTypes';

function removeEntity(entity: DeletionSnapshot['entities'][number]) {
  const st = useEditorStore.getState();
  switch (entity.kind) {
    case 'car':
      st.removeCar(entity.car.id);
      break;
    case 'rsu': {
      const idx = st.RSUs.findIndex((r) => r.id === entity.rsu.id);
      if (idx !== -1) st.removeRSU(idx);
      break;
    }
    case 'building':
      st.removeBuilding(entity.building.id);
      break;
    case 'pedestrian':
      st.removePedestrian(entity.pedestrian.id);
      break;
    case 'point':
      st.removePoint(entity.point.id);
      break;
    case 'lidar':
      st.removeLidar(entity.lidar.id);
      break;
  }
}

function removeEntities(entities: DeletionSnapshot['entities']) {
  entities.forEach(removeEntity);
}

export function watchSnapshotValidity(snapshotId: string) {
  return (invalidate: () => void) => {
    const stillExists = () =>
      useEditorStore
        .getState()
        .deletionHistory.some((h) => h.snapshotId === snapshotId);

    if (!stillExists()) {
      invalidate();
      return () => {};
    }

    return useEditorStore.subscribe((state) => {
      const exists = state.deletionHistory.some(
        (h) => h.snapshotId === snapshotId
      );
      if (!exists) invalidate();
    });
  };
}

export function pushSingleDeletionSnapshot({
  id,
  label,
}: BuildSingleNodeSnapshotProps): PushedSnapshotInfo | null {
  const s = useEditorStore.getState();
  const snapshot = buildSingleNodeSnapshot(id, label, s);
  if (!snapshot) return null;

  const snapshotId = s.pushDeletionSnapshot(snapshot);
  const entities = snapshot.entities;

  s.pushHistoryEntry({
    label: snapshot.label,
    sourceSnapshotId: snapshotId,
    undo: () => {
      useEditorStore.getState().restoreLastDeletion(snapshotId);
    },
    redo: () => {
      removeEntities(entities);
    },
  });

  return { snapshotId, label: snapshot.label };
}

export function pushClearSceneSnapshot(): PushedSnapshotInfo | null {
  const s = useEditorStore.getState();
  const entities: DeletionSnapshot['entities'] = [];

  const pointsByCarId = groupByCarId(s.points);
  const lidarsByCarId = groupByCarId(s.lidars);

  s.cars.forEach((car, index) => {
    entities.push({
      kind: 'car',
      index,
      car,
      points: getGroupedByCarId(pointsByCarId, car.id),
      lidars: getGroupedByCarId(lidarsByCarId, car.id),
    });
  });
  s.RSUs.forEach((rsu, index) => entities.push({ kind: 'rsu', index, rsu }));
  s.buildings.forEach((building, index) =>
    entities.push({ kind: 'building', index, building })
  );
  s.pedestrians.forEach((pedestrian, index) =>
    entities.push({ kind: 'pedestrian', index, pedestrian })
  );

  const carIds = new Set(s.cars.map((c) => c.id));
  const orphanedPoints = s.points.filter((p) => !carIds.has(p.carId));
  const orphanedLidars = s.lidars.filter((l) => !carIds.has(l.carId));
  orphanedPoints.forEach((point, index) =>
    entities.push({ kind: 'point', index, point })
  );
  orphanedLidars.forEach((lidar, index) =>
    entities.push({ kind: 'lidar', index, lidar })
  );

  if (entities.length === 0) return null;

  const totalObjects = entities.length;
  const label = `Scene cleared (${totalObjects} object${totalObjects === 1 ? '' : 's'})`;

  const snapshotId = s.pushDeletionSnapshot({
    origin: 'clear-scene',
    label,
    entities,
  });

  s.pushHistoryEntry({
    label,
    sourceSnapshotId: snapshotId,
    undo: () => {
      useEditorStore.getState().restoreLastDeletion(snapshotId);
    },
    redo: () => {
      removeEntities(entities);
    },
  });

  return { snapshotId, label };
}

export function watchHistoryEntryValidity(entryId: string) {
  return (invalidate: () => void) => {
    const stillValid = () => {
      const state = useEditorStore.getState();
      return state.historyStack[state.historyCursor - 1]?.id === entryId;
    };

    if (!stillValid()) {
      invalidate();
      return () => {};
    }

    return useEditorStore.subscribe((state) => {
      const valid = state.historyStack[state.historyCursor - 1]?.id === entryId;
      if (!valid) invalidate();
    });
  };
}
