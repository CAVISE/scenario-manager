import { useEditorStore } from '@/store';
import { MoveKind } from '../types/createTransformListenerTypes';

export function readSnapshot(
  kind: MoveKind,
  id: string
): Record<string, unknown> | null {
  const s = useEditorStore.getState();
  switch (kind) {
    case 'car': {
      const car = s.cars.find((c) => c.id === id);
      if (!car) return null;
      const { x, y, z, rotation, scale } = car;
      return { x, y, z, rotation, scale };
    }
    case 'rsu': {
      const rsu = s.RSUs.find((r) => r.id === id);
      if (!rsu) return null;
      const { x, y, z } = rsu;
      return { x, y, z };
    }
    case 'lidar': {
      const lidar = s.lidars.find((l) => l.id === id);
      if (!lidar) return null;
      const { x, y, z, rotation } = lidar;
      return { x, y, z, rotation };
    }
    case 'building': {
      const building = s.buildings.find((b) => b.id === id);
      if (!building) return null;
      const { x, y, z, rotation, scale, material, height } = building;
      return { x, y, z, rotation, scale, material, height };
    }
    case 'pedestrian': {
      const pedestrian = s.pedestrians.find((p) => p.id === id);
      if (!pedestrian) return null;
      const { x, y, z } = pedestrian;
      return { x, y, z };
    }
    case 'point': {
      const point = s.points.find((p) => p.id === id);
      if (!point) return null;
      const { x, y, z } = point;
      return { x, y, z };
    }
  }
}
