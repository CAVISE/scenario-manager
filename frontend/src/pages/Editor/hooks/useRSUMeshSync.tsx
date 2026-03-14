import { useEffect } from 'react';
import * as THREE from 'three';
import { GLTFLoader, TransformControls } from 'three-stdlib';
import type { RSU } from '../../../store/types/useEditorStoreTypes';

interface UseRSUMeshSyncOptions {
  RSUs: RSU[];
  sceneRef: React.MutableRefObject<THREE.Scene | undefined>;
  pointsArrRef: React.MutableRefObject<THREE.Mesh[]>;
  pointsObjsRef: React.MutableRefObject<THREE.Mesh[]>;
  transformControlsRef: React.MutableRefObject<TransformControls | null>;
  updateSceneGraph: () => void;
}

const loader = new GLTFLoader();
let rsuModel: THREE.Object3D | null = null;

loader.load('/pedestrian_traffic_light.glb', (gltf) => {
  rsuModel = gltf.scene;
});

export function useRSUMeshSync({
  RSUs,
  sceneRef,
  pointsArrRef,
  pointsObjsRef,
  transformControlsRef,
  updateSceneGraph,
}: UseRSUMeshSyncOptions): void {
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const tc       = transformControlsRef.current;
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

    RSUs.forEach(rsu => {
      const existing = pointsArrRef.current.find(p => p.userData.id === rsu.id);

      if (existing) {
        const isAttached = attached === existing;
        if (!isAttached) {
          existing.position.set(rsu.x, rsu.y, rsu.z);
        }
        return;
      }

      let obj: THREE.Object3D;
      if (rsuModel) {
        obj = rsuModel.clone(true);
        obj.scale.setScalar(0.05);
        obj.rotation.x += Math.PI / 2;
      } else {
        const geometry = new THREE.BoxGeometry(5, 5, 5);
        const material = new THREE.MeshBasicMaterial({ color: 0x0000ff });
        obj = new THREE.Mesh(geometry, material);
      }

      obj.userData = { type: 'point', id: rsu.id };
      obj.position.set(rsu.x, rsu.y, rsu.z);

      scene.add(obj);
      pointsArrRef.current.push(obj as THREE.Mesh);
      pointsObjsRef.current.push(obj as THREE.Mesh);
    });

    updateSceneGraph();
  }, [RSUs]);
}