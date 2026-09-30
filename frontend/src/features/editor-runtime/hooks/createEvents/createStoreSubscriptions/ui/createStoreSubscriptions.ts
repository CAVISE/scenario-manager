import { useEditorStore } from '@/store';
import { CreateStoreSubscriptionsOptions } from '../types/createStoreSubscriptionsTypes';

export function createStoreSubscriptions(
  opts: CreateStoreSubscriptionsOptions
): () => void {
  const { getIsDragging, syncRoutePointMeshes, updateSceneGraph } = opts;

  let prevPoints = useEditorStore.getState().points;
  let prevCars = useEditorStore.getState().cars;
  let syncRoutePointMeshesTimeout: ReturnType<typeof setTimeout> | null = null;

  const unsubPoints = useEditorStore.subscribe(() => {
    const nextPoints = useEditorStore.getState().points;
    const nextCars = useEditorStore.getState().cars;
    if (nextPoints === prevPoints && nextCars === prevCars) return;
    prevPoints = nextPoints;
    prevCars = nextCars;
    if (getIsDragging()) return;
    if (syncRoutePointMeshesTimeout) clearTimeout(syncRoutePointMeshesTimeout);
    syncRoutePointMeshesTimeout = setTimeout(() => {
      syncRoutePointMeshes();
      updateSceneGraph();
      syncRoutePointMeshesTimeout = null;
    }, 0);
  });

  return () => {
    unsubPoints();
    if (syncRoutePointMeshesTimeout) clearTimeout(syncRoutePointMeshesTimeout);
  };
}
