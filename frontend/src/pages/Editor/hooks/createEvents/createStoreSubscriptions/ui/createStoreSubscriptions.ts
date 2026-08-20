import { useEditorStore } from '@/store';
import { CreateStoreSubscriptionsOptions } from '../types/createStoreSubscriptionsTypes';

export function createStoreSubscriptions(
  opts: CreateStoreSubscriptionsOptions,
): () => void {
  const { getIsDragging, loadPoints, updateSceneGraph } = opts;

  let prevPoints = useEditorStore.getState().points;
  let prevCars = useEditorStore.getState().cars;
  let loadPointsTimeout: ReturnType<typeof setTimeout> | null = null;

  const unsubPoints = useEditorStore.subscribe(() => {
    const nextPoints = useEditorStore.getState().points;
    const nextCars = useEditorStore.getState().cars;
    if (nextPoints === prevPoints && nextCars === prevCars) return;
    prevPoints = nextPoints;
    prevCars = nextCars;
    if (getIsDragging()) return;
    if (loadPointsTimeout) clearTimeout(loadPointsTimeout);
    loadPointsTimeout = setTimeout(() => {
      loadPoints();
      updateSceneGraph();
      loadPointsTimeout = null;
    }, 0);
  });

  return () => {
    unsubPoints();
    if (loadPointsTimeout) clearTimeout(loadPointsTimeout);
  };
}
