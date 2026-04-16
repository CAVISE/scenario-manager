import { useEffect } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three-stdlib';
import { useEditorStore } from '../../../store/useEditorStore';

const loader = new GLTFLoader();
let buildingModel: THREE.Object3D | null = null;
let buildingModelPromise: Promise<boolean> | null = null;

function ensureBuildingModel(): Promise<boolean> {
  if (buildingModel) return Promise.resolve(true);
  if (buildingModelPromise) return buildingModelPromise;
  buildingModelPromise = new Promise((resolve) => {
    loader.load(
      '/nyc_bronx_buildings.glb',
      (gltf) => {
        buildingModel = gltf.scene;
        buildingModel.rotation.x = -Math.PI / 2;
        buildingModel.scale.setScalar(0.5);
        const box = new THREE.Box3().setFromObject(buildingModel);
        buildingModel.position.z -= box.min.z;
        buildingModel.position.z = -10000; 
        buildingModel.rotation.x += Math.PI;
        resolve(true);
      },
      undefined,
      () => {
        const geometry = new THREE.BoxGeometry(20, 20, 20);
        const material = new THREE.MeshBasicMaterial({ color: 0x666666 });
        buildingModel = new THREE.Mesh(geometry, material);
        resolve(true);
      }
    );
  });
  return buildingModelPromise;
}

interface UseBuildingMeshSyncOptions {
  sceneRef: React.MutableRefObject<THREE.Scene | undefined>;
  buildingMeshesRef: React.MutableRefObject<THREE.Mesh[]>;
  transformControlsRef: React.MutableRefObject<any>;  
  updateSceneGraph: () => void;
}

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
        const buildingIds = new Set(buildings.map(b => b.id));


        buildingMeshesRef.current = buildingMeshesRef.current.filter(mesh => {
          if (buildingIds.has(mesh.userData.id)) return true;
          if (attached === mesh) tc?.detach();
          mesh.traverse(child => {
            const m = child as THREE.Mesh;
            if (m.isMesh) {
              m.geometry?.dispose();
              (Array.isArray(m.material) ? m.material : [m.material]).forEach(mt => mt?.dispose());
            }
          });
          scene.remove(mesh);
          return false;
        });


        buildings.forEach(building => {
          const existing = buildingMeshesRef.current.find(m => m.userData.id === building.id);

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
  }, [transformControlsRef, updateSceneGraph]);

  useEffect(() => {
    const unsubscribe = useEditorStore.subscribe(() => {
      const buildings = useEditorStore.getState().buildings;

      const scene = sceneRef.current;
      if (scene) {
        ensureBuildingModel().then(() => {

          const tc = transformControlsRef.current;
          const attached = (tc as unknown as { object?: THREE.Object3D })?.object;

          const buildingIds = new Set(buildings.map(b => b.id));


          buildingMeshesRef.current = buildingMeshesRef.current.filter(mesh => {
            if (buildingIds.has(mesh.userData.id)) return true;
            if (attached === mesh) tc?.detach();
            mesh.traverse(child => {
              const m = child as THREE.Mesh;
              if (m.isMesh) {
                m.geometry?.dispose();
                (Array.isArray(m.material) ? m.material : [m.material]).forEach(mt => mt?.dispose());
              }
            });
            scene.remove(mesh);
            return false;
          });


          buildings.forEach(building => {
            const existing = buildingMeshesRef.current.find(m => m.userData.id === building.id);

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