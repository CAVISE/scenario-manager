import { useEditorStore } from '@/store';
import type { DeletionSnapshot } from '@/store/types/useEditorStoreTypes';

export function buildSingleNodeSnapshot(
  id: string,
  label: string,
  s: ReturnType<typeof useEditorStore.getState>
): Omit<DeletionSnapshot, 'snapshotId' | 'deletedAt'> | null {
  switch (label) {
    case 'CAR': {
      const index = s.cars.findIndex((car) => car.id === id);
      if (index === -1) return null;
      return {
        origin: 'single-delete',
        label: 'Car deleted',
        entities: [
          {
            kind: 'car',
            index,
            car: s.cars[index],
            points: s.points.filter((point) => point.carId === id),
            lidars: s.lidars.filter((lidar) => lidar.carId === id),
          },
        ],
      };
    }
    case 'RSU': {
      const index = s.RSUs.findIndex((rsu) => rsu.id === id);
      if (index === -1) return null;
      return {
        origin: 'single-delete',
        label: 'RSU deleted',
        entities: [{ kind: 'rsu', index, rsu: s.RSUs[index] }],
      };
    }
    case 'BLD': {
      const index = s.buildings.findIndex((building) => building.id === id);
      if (index === -1) return null;
      return {
        origin: 'single-delete',
        label: 'Building deleted',
        entities: [{ kind: 'building', index, building: s.buildings[index] }],
      };
    }
    case 'HMN': {
      const index = s.pedestrians.findIndex((person) => person.id === id);
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
      const index = s.points.findIndex((point) => point.id === id);
      if (index === -1) return null;
      return {
        origin: 'single-delete',
        label: 'Waypoint deleted',
        entities: [{ kind: 'point', index, point: s.points[index] }],
      };
    }
    case 'LDR': {
      const index = s.lidars.findIndex((lidar) => lidar.id === id);
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
