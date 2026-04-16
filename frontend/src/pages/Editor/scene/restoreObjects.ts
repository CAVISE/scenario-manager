import { useEditorStore } from '../../../store/useEditorStore';
import { RestoreObjectsOptions } from './types/restoreObjectsTypes';

export function restoreObjects(opts: RestoreObjectsOptions): void {
  const { scene, buildingModelRef, loadRSU, updateSceneGraph } = opts;
  const s = useEditorStore.getState();

  if (s.RSUs.length) loadRSU();

  function tryRestoreBuildings(attempt = 0) {
    if (!buildingModelRef.current) {
      if (attempt < 20) setTimeout(() => tryRestoreBuildings(attempt + 1), 100);
      return;
    }
    s.buildings.forEach(b => {
      const already = scene.children.find(c => c.userData.id === b.id);
      if (already) return;
      const m = buildingModelRef.current!.clone(true);
      m.userData = { type: 'building', id: b.id };
      m.position.set(b.x, b.y, b.z);
      m.rotation.y = b.rotation ?? 0;
      m.scale.setScalar(b.scale ?? 0.5);
      scene.add(m);
    });
    updateSceneGraph();
  }

  tryRestoreBuildings();
}