import { useEditorStore } from '@/store';
import {
  buildSingleNodeSnapshot,
  DeletionSnapshot,
  type BuildSingleNodeSnapshotProps,
  type PushedSnapshotInfo,
} from '../types/deletionSnapshotsTypes';

export function pushSingleDeletionSnapshot({
  id,
  label,
}: BuildSingleNodeSnapshotProps): PushedSnapshotInfo | null {
  const s = useEditorStore.getState();
  const snapshot = buildSingleNodeSnapshot(id, label, s);
  if (!snapshot) return null;

  const snapshotId = s.pushDeletionSnapshot(snapshot);
  return { snapshotId, label: snapshot.label };
}

export function pushClearSceneSnapshot(): PushedSnapshotInfo | null {
  const s = useEditorStore.getState();
  const entities: DeletionSnapshot['entities'] = [];

  s.cars.forEach((car, index) => {
    entities.push({
      kind: 'car',
      index,
      car,
      points: s.points.filter((p) => p.carId === car.id),
      lidars: s.lidars.filter((l) => l.carId === car.id),
    });
  });
  s.RSUs.forEach((rsu, index) => entities.push({ kind: 'rsu', index, rsu }));
  s.buildings.forEach((building, index) =>
    entities.push({ kind: 'building', index, building }),
  );
  s.pedestrians.forEach((pedestrian, index) =>
    entities.push({ kind: 'pedestrian', index, pedestrian }),
  );

  const carIds = new Set(s.cars.map((c) => c.id));
  const orphanedPoints = s.points.filter((p) => !carIds.has(p.carId));
  const orphanedLidars = s.lidars.filter((l) => !carIds.has(l.carId));
  orphanedPoints.forEach((point, index) =>
    entities.push({ kind: 'point', index, point }),
  );
  orphanedLidars.forEach((lidar, index) =>
    entities.push({ kind: 'lidar', index, lidar }),
  );

  if (entities.length === 0) return null;

  const totalObjects =
    s.cars.length +
    s.RSUs.length +
    s.buildings.length +
    s.pedestrians.length +
    orphanedPoints.length +
    orphanedLidars.length;
  const label = `Scene cleared (${totalObjects} object${totalObjects === 1 ? '' : 's'})`;

  const snapshotId = s.pushDeletionSnapshot({
    origin: 'clear-scene',
    label,
    entities,
  });

  return { snapshotId, label };
}
