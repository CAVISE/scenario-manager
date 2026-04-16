import { useEffect } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three-stdlib';
import { UseRSUMeshSyncOptions } from './types/useRSUMeshSyncMeshTypes';
import { useEditorStore } from '../../../store/useEditorStore';
import { useEditorRefs } from '../context/EditorRefsContext';

const loader = new GLTFLoader();
let rsuModel: THREE.Object3D | null = null;
let rsuModelPromise: Promise<boolean> | null = null;

function ensureRsuModel(): Promise<boolean> {
  if (rsuModel) return Promise.resolve(true);
  if (rsuModelPromise) return rsuModelPromise;
  rsuModelPromise = new Promise((resolve) => {
    loader.load(
      '/pedestrian_traffic_light.glb',
      (gltf) => {
        rsuModel = gltf.scene;
        resolve(true);
      },
      undefined,
      () => {
        rsuModel = null;
        resolve(false);
      }
    );
  });
  return rsuModelPromise;
}

export function useRSUMeshSync({

  updateSceneGraph,
}: UseRSUMeshSyncOptions): void {
  const RSUs = useEditorStore(s => s.RSUs)
  const { sceneRef, pointsArrRef, transformControlsRef, pointsObjsRef, rsuMeshesRef} = useEditorRefs()
  useEffect(() => {
    const trySync = (attempts = 0) => {
      const scene = sceneRef.current;

      if (!scene) {
        if (attempts < 10) setTimeout(() => trySync(attempts + 1), 300);
        return;
      }

      ensureRsuModel().then((hasModel) => {
        const tc = transformControlsRef.current;
        const attached = (tc as unknown as { object?: THREE.Object3D })?.object;

        const rsuIds = new Set(RSUs.map(r => r.id));

        pointsArrRef.current = pointsArrRef.current.filter(p => {
          if (rsuIds.has(p.userData.id)) return true;
          if (attached === p) tc?.detach();
          p.traverse(child => {
            const m = child as THREE.Mesh;
            if (m.isMesh) {
              m.geometry?.dispose();
              (Array.isArray(m.material) ? m.material : [m.material]).forEach(mt => mt?.dispose());
            }
          });
          scene.remove(p);
          return false;
        });

        pointsObjsRef.current = [...pointsArrRef.current];
        rsuMeshesRef.current  = [...pointsArrRef.current];

        RSUs.forEach(rsu => {
          const existing = pointsArrRef.current.find(p => p.userData.id === rsu.id);

          if (existing) {
            if (existing.userData?.isFallbackRSU) {
              if (!hasModel) {
                if (attached !== existing) existing.position.set(rsu.x, rsu.y, rsu.z);
                return;
              }
              if (attached === existing) tc?.detach();
              existing.traverse(child => {
                const m = child as THREE.Mesh;
                if (m.isMesh) {
                  m.geometry?.dispose();
                  (Array.isArray(m.material) ? m.material : [m.material]).forEach(mt => mt?.dispose());
                }
              });
              scene.remove(existing);

              const oldIdx = pointsArrRef.current.findIndex(p => p.userData.id === rsu.id);
              if (oldIdx !== -1) {
                pointsArrRef.current.splice(oldIdx, 1);
                pointsObjsRef.current.splice(oldIdx, 1);
                rsuMeshesRef.current.splice(oldIdx, 1);
              }
            } else {
              if (attached !== existing) existing.position.set(rsu.x, rsu.y, rsu.z);
              return;
            }
          }

          let obj: THREE.Object3D;
          if (hasModel && rsuModel) {
            obj = rsuModel.clone(true);
            obj.scale.setScalar(0.05);
            obj.rotation.x += Math.PI / 2;
            obj.userData = { type: 'point', id: rsu.id, isFallbackRSU: false };
          } else {
            const geometry = new THREE.BoxGeometry(5, 5, 5);
            const material = new THREE.MeshBasicMaterial({ color: 0x0000ff });
            obj = new THREE.Mesh(geometry, material);
            obj.userData = { type: 'point', id: rsu.id, isFallbackRSU: true };
          }
          obj.position.set(rsu.x, rsu.y, rsu.z);
          scene.add(obj);

          pointsArrRef.current.push(obj as THREE.Mesh);
          pointsObjsRef.current.push(obj as THREE.Mesh);
          rsuMeshesRef.current.push(obj as THREE.Mesh);
        });

        updateSceneGraph();
      });
    };

    trySync();
  }, [RSUs]);
}