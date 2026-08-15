import { useEffect } from 'react';
import * as THREE from 'three';
import { useEditorStore } from '../../../../../../../store';
import { useHooks, useEditorRefs } from '../../../../../context';
import { disposeMesh } from '../../../../../../components/RightPanel/components/SceneTreePanel/funcs/sceneUtils';

export function useBuildingMeshSync(): void {
  const buildings = useEditorStore((s) => s.buildings);
  const { updateSceneGraph, buildingModelRef } = useHooks();
  const { sceneRef, buildingMeshesRef, transformControlsRef } = useEditorRefs();

  useEffect(() => {
    let cancelled = false;

    const trySync = (attempts = 0) => {
      const scene = sceneRef.current;
      const model = buildingModelRef.current;

      if (!scene || !model) {
        if (attempts < 20) setTimeout(() => trySync(attempts + 1), 100);
        return;
      }
      if (cancelled) return;

      const tc = transformControlsRef.current;
      const attached = (tc as unknown as { object?: THREE.Object3D })?.object;

      const currentBuildings = useEditorStore.getState().buildings;
      const buildingIds = new Set(currentBuildings.map((b) => b.id));

      buildingMeshesRef.current = buildingMeshesRef.current.filter((mesh) => {
        if (buildingIds.has(mesh.userData.id)) return true;
        if (attached === mesh) tc?.detach();
        disposeMesh(mesh);
        scene.remove(mesh);
        return false;
      });

      currentBuildings.forEach((building) => {
        const existing = buildingMeshesRef.current.find(
          (m) => m.userData.id === building.id,
        );

        if (existing) {
          if (attached !== existing) {
            existing.position.set(building.x, building.y, building.z);
            existing.rotation.y = building.rotation ?? 0;
            existing.scale.setScalar(building.scale ?? 0.5);
          }
          return;
        }

        const mesh = model.clone(true);
        mesh.userData = { type: 'building', id: building.id };
        mesh.position.set(building.x, building.y, building.z);
        mesh.rotation.y = building.rotation ?? 0;
        mesh.scale.setScalar(building.scale ?? 0.5);
        scene.add(mesh);

        buildingMeshesRef.current.push(mesh);
      });

      updateSceneGraph();
    };

    trySync();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildings, updateSceneGraph]);
}
