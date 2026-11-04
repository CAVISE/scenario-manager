import { useEditorStore } from '@/store';
import type { SelectedObject } from '@/shared/types/sceneTypes';
import { useWorkspacePreferences } from '@/store/ui/useWorkspacePreferences';

export function duplicateSelectedObject(): string | null {
  const store = useEditorStore.getState();
  const selected = store.selectedObjects[0];
  if (!selected?.id || store.selectedObjects.length !== 1) return null;

  const id = duplicateByType(store, selected);
  if (!id) return null;

  store.selectObjects([{ type: selectionType(selected.type), id }]);
  return id;
}

function duplicateByType(
  store: ReturnType<typeof useEditorStore.getState>,
  selected: SelectedObject
): string | null {
  const duplicateOffset = useWorkspacePreferences.getState().duplicateOffset;
  const offset = <T extends { id: string; x: number; y: number }>(
    entity: T
  ) => {
    const copy = { ...entity };
    Reflect.deleteProperty(copy, 'id');
    return {
      ...copy,
      x: entity.x + duplicateOffset,
      y: entity.y + duplicateOffset,
    };
  };

  if (selected.type === 'car') {
    const car = store.cars.find((item) => item.id === selected.id);
    return car ? (store.addCarsBatch([offset(car)])[0] ?? null) : null;
  }
  if (selected.type === 'rsu') {
    const rsu = store.RSUs.find((item) => item.id === selected.id);
    return rsu ? (store.addRSUsBatch([offset(rsu)])[0] ?? null) : null;
  }
  if (selected.type === 'building') {
    const building = store.buildings.find((item) => item.id === selected.id);
    return building
      ? (store.addBuildingsBatch([offset(building)])[0] ?? null)
      : null;
  }
  if (selected.type === 'pedestrian') {
    const pedestrian = store.pedestrians.find(
      (item) => item.id === selected.id
    );
    return pedestrian
      ? (store.addPedestriansBatch([offset(pedestrian)])[0] ?? null)
      : null;
  }
  if (selected.type === 'lidar') {
    const lidar = store.lidars.find((item) => item.id === selected.id);
    return lidar ? (store.addLidarsBatch([offset(lidar)])[0] ?? null) : null;
  }
  if (selected.type === 'point' || selected.type === 'route-point') {
    const point = store.points.find((item) => item.id === selected.id);
    return point ? (store.addPointsBatch([offset(point)])[0] ?? null) : null;
  }
  return null;
}

function selectionType(type: SelectedObject['type']): SelectedObject['type'] {
  return type === 'route-point' ? 'point' : type;
}
