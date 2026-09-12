import { useEditorStore } from '../../../../../store';
import type { DeletionSnapshot } from '../../../../../store/editor-store.types';

export type PushedSnapshotInfo = {
  snapshotId: string;
  label: string;
};

export type BuildSingleNodeSnapshotProps = {
  id: string;
  label: string;
};

export type { DeletionSnapshot };

export function buildSingleNodeSnapshot(
  id: string,
  label: string,
  s: ReturnType<typeof useEditorStore.getState>,
): Omit<DeletionSnapshot, 'snapshotId' | 'deletedAt'> | null {
  switch (label) {
    case 'CAR': {
      const index = s.cars.findIndex((c) => c.id === id);
      if (index === -1) return null;
      const car = s.cars[index];
      return {
        origin: 'single-delete',
        label: 'Car deleted',
        entities: [
          {
            kind: 'car',
            index,
            car,
            points: s.points.filter((p) => p.carId === id),
            lidars: s.lidars.filter((l) => l.carId === id),
          },
        ],
      };
    }
    case 'RSU': {
      const index = s.RSUs.findIndex((r) => r.id === id);
      if (index === -1) return null;
      return {
        origin: 'single-delete',
        label: 'RSU deleted',
        entities: [{ kind: 'rsu', index, rsu: s.RSUs[index] }],
      };
    }
    case 'BLD': {
      const index = s.buildings.findIndex((b) => b.id === id);
      if (index === -1) return null;
      return {
        origin: 'single-delete',
        label: 'Building deleted',
        entities: [{ kind: 'building', index, building: s.buildings[index] }],
      };
    }
    case 'HMN': {
      const index = s.pedestrians.findIndex((p) => p.id === id);
      if (index === -1) return null;
      return {
        origin: 'single-delete',
        label: 'Pedestrian deleted',
        entities: [
          { kind: 'pedestrian', index, pedestrian: s.pedestrians[index] },
        ],
      };
    }
    case 'WPT': {
      const index = s.points.findIndex((p) => p.id === id);
      if (index === -1) return null;
      return {
        origin: 'single-delete',
        label: 'Waypoint deleted',
        entities: [{ kind: 'point', index, point: s.points[index] }],
      };
    }
    case 'LDR': {
      const index = s.lidars.findIndex((l) => l.id === id);
      if (index === -1) return null;
      return {
        origin: 'single-delete',
        label: 'Lidar deleted',
        entities: [{ kind: 'lidar', index, lidar: s.lidars[index] }],
      };
    }
    default:
      return null;
  }
}
