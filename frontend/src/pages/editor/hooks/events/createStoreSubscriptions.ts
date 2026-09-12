import * as THREE from 'three';
import { useEditorStore } from '../../../../store';
import { CreateStoreSubscriptionsOptions } from './createStoreSubscriptions.types';

export function createStoreSubscriptions(
  opts: CreateStoreSubscriptionsOptions,
): () => void {
  const {
    sceneRef,
    buildingModelRef,
    transformControlsRef,
    getIsDragging,
    loadRSU,
    loadPoints,
    updateSceneGraph,
  } = opts;

  let prevBuildings = useEditorStore.getState().buildings;
  let prevPoints = useEditorStore.getState().points;
  let prevCars = useEditorStore.getState().cars;
  let prevRSUs = useEditorStore.getState().RSUs;
  let loadPointsTimeout: ReturnType<typeof setTimeout> | null = null;
  const unsubBuildings = useEditorStore.subscribe(() => {
    const nextBuildings = useEditorStore.getState().buildings;
    if (nextBuildings === prevBuildings) return;
    prevBuildings = nextBuildings;
    if (getIsDragging()) return;

    const scene = sceneRef.current;
    const model = buildingModelRef.current;
    if (!scene || !model) return;

    const tc = transformControlsRef.current;
    const attached = (tc as unknown as { object?: THREE.Object3D } | undefined)
      ?.object;

    const toRemove = scene.children.filter(
      (obj) => obj.userData.type === 'building',
    );
    toRemove.forEach((obj) => {
      if (attached && (attached === obj || obj.getObjectById(attached.id)))
        tc?.detach();
      scene.remove(obj);
      obj.traverse((child) => {
        const m = child as THREE.Mesh;
        if (m.isMesh) {
          m.geometry?.dispose();
          (Array.isArray(m.material) ? m.material : [m.material]).forEach(
            (mt) => mt?.dispose(),
          );
        }
      });
    });
    nextBuildings.forEach((b) => {
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
    unsubBuildings();
    unsubRSU();
    unsubPoints();
    if (loadPointsTimeout) clearTimeout(loadPointsTimeout);
  };
}
