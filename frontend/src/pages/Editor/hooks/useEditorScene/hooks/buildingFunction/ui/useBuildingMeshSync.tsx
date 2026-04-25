import { useEffect } from 'react';
import * as THREE from 'three';
import { useEditorStore } from '../../../../../../../store';
import { buildingModel, ensureBuildingModel } from '../utils/BuildingUtils';
import { UseBuildingMeshSyncOptions } from '../types/useBuildingMeshTypes';

export function useBuildingMeshSync({
  sceneRef,
  buildingMeshesRef,
  transformControlsRef,
  updateSceneGraph,
}: UseBuildingMeshSyncOptions): void {
  useEffect(() => {
    const trySync = (attempts = 0) => {
      const scene = sceneRef.current;

      if (!scene) {
        if (attempts < 10) setTimeout(() => trySync(attempts + 1), 300);
        return;
      }

      ensureBuildingModel().then((hasModel) => {
        const tc = transformControlsRef.current;
        const attached = (tc as unknown as { object?: THREE.Object3D })?.object;

        const buildings = useEditorStore.getState().buildings;
        const buildingIds = new Set(buildings.map((b) => b.id));

        buildingMeshesRef.current = buildingMeshesRef.current.filter((mesh) => {
          if (buildingIds.has(mesh.userData.id)) return true;
          if (attached === mesh) tc?.detach();
          mesh.traverse((child) => {
            const m = child as THREE.Mesh;
            if (m.isMesh) {
              m.geometry?.dispose();
              (Array.isArray(m.material) ? m.material : [m.material]).forEach(
                (mt) => mt?.dispose(),
              );
            }
          });
          scene.remove(mesh);
          return false;
        });

        buildings.forEach((building) => {
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

          let obj: THREE.Object3D;
          if (hasModel && buildingModel) {
            obj = buildingModel.clone(true);
            obj.userData = { type: 'building', id: building.id };
          } else {
            const geometry = new THREE.BoxGeometry(20, 20, 20);
            const material = new THREE.MeshBasicMaterial({ color: 0x888888 });
            obj = new THREE.Mesh(geometry, material);
            obj.userData = { type: 'building', id: building.id };
          }

          obj.position.set(building.x, building.y, building.z);
          obj.rotation.y = building.rotation ?? 0;
          obj.scale.setScalar(building.scale ?? 0.5);
          scene.add(obj);

          buildingMeshesRef.current.push(obj as THREE.Mesh);
        });

        updateSceneGraph();
      });
    };

    trySync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transformControlsRef, updateSceneGraph]);

  useEffect(() => {
    const unsubscribe = useEditorStore.subscribe(() => {
      const buildings = useEditorStore.getState().buildings;

      const scene = sceneRef.current;
      if (scene) {
        ensureBuildingModel().then(() => {
          const tc = transformControlsRef.current;
          const attached = (tc as unknown as { object?: THREE.Object3D })
            ?.object;

          const buildingIds = new Set(buildings.map((b) => b.id));

          buildingMeshesRef.current = buildingMeshesRef.current.filter(
            (mesh) => {
              if (buildingIds.has(mesh.userData.id)) return true;
              if (attached === mesh) tc?.detach();
              mesh.traverse((child) => {
                const m = child as THREE.Mesh;
                if (m.isMesh) {
                  m.geometry?.dispose();
                  (Array.isArray(m.material)
                    ? m.material
                    : [m.material]
                  ).forEach((mt) => mt?.dispose());
                }
              });
              scene.remove(mesh);
              return false;
            },
          );

          buildings.forEach((building) => {
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

            let obj: THREE.Object3D;
            if (buildingModel) {
              obj = buildingModel.clone(true);
              obj.userData = { type: 'building', id: building.id };
            } else {
              const geometry = new THREE.BoxGeometry(20, 20, 20);
              const material = new THREE.MeshBasicMaterial({ color: 0x888888 });
              obj = new THREE.Mesh(geometry, material);
              obj.userData = { type: 'building', id: building.id };
            }

            obj.position.set(building.x, building.y, building.z);
            obj.rotation.y = building.rotation ?? 0;
            obj.scale.setScalar(building.scale ?? 0.5);
            scene.add(obj);

            buildingMeshesRef.current.push(obj as THREE.Mesh);
          });

          updateSceneGraph();
        });
      }
    });

    return unsubscribe;
  }, [sceneRef, buildingMeshesRef, transformControlsRef, updateSceneGraph]);
}
