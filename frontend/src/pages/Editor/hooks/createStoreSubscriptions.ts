import { useEditorStore } from '../../../store/useEditorStore';
import { CreateStoreSubscriptionsOptions } from './types/createStoreSubscriptionsTypes';


export function createStoreSubscriptions(opts: CreateStoreSubscriptionsOptions): () => void {
  const { sceneRef, buildingModelRef, getIsDragging, loadRSU, loadPoints, updateSceneGraph } = opts;

  let prevBuildings = useEditorStore.getState().buildings;
  let prevPoints    = useEditorStore.getState().points;
  let prevCars      = useEditorStore.getState().cars;
  let prevRSUs      = useEditorStore.getState().RSUs;
  let loadPointsTimeout: ReturnType<typeof setTimeout> | null = null;

  const unsubBuildings = useEditorStore.subscribe(() => {
    const nextBuildings = useEditorStore.getState().buildings;
    if (nextBuildings === prevBuildings) return;
    prevBuildings = nextBuildings;
    if (getIsDragging()) return;

    const scene = sceneRef.current;
    const model = buildingModelRef.current;
    if (!scene || !model) return;

    scene.children = scene.children.filter(obj => obj.userData.type !== 'building');
    nextBuildings.forEach(b => {
      const m = model.clone(true);
      m.userData = { type: 'building', id: b.id };
      m.position.set(b.x, b.y, b.z);
      m.rotation.y = b.rotation ?? 0;
      m.scale.setScalar(b.scale ?? 0.5);
      scene.add(m);
    });
    updateSceneGraph();
  });

  const unsubRSU = useEditorStore.subscribe(() => {
    const nextRSUs = useEditorStore.getState().RSUs;
    if (nextRSUs === prevRSUs) return;
    prevRSUs = nextRSUs;
    if (getIsDragging()) return;
    loadRSU();
    updateSceneGraph();
  });

  const unsubPoints = useEditorStore.subscribe(() => {
    const nextPoints = useEditorStore.getState().points;
    const nextCars   = useEditorStore.getState().cars;
    if (nextPoints === prevPoints && nextCars === prevCars) return;
    prevPoints = nextPoints;
    prevCars   = nextCars;
    if (getIsDragging()) return;
    if (loadPointsTimeout) clearTimeout(loadPointsTimeout);
    loadPointsTimeout = setTimeout(() => {
      loadPoints();
      loadPointsTimeout = null;
    }, 0);
  });

  return () => {
    unsubBuildings();
    unsubRSU();
    unsubPoints();
    if (loadPointsTimeout) clearTimeout(loadPointsTimeout);
  };
}