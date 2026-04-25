import { useEffect, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three-stdlib';
import { useEditorStore } from '../../../../../../../store';
import { useHooks, useEditorRefs } from '../../../../../context';

const loader = new GLTFLoader();
let pedestrianModel: THREE.Object3D | null = null;
const modelCallbacks: (() => void)[] = [];

loader.load('/pedestrian_traffic_light.glb', (gltf) => {
  pedestrianModel = gltf.scene;
  modelCallbacks.forEach((cb) => cb());
  modelCallbacks.length = 0;
});

export function usePedestrianMeshSync() {
  const [modelReady, setModelReady] = useState(!!pedestrianModel);
  const pedestrians = useEditorStore((s) => s.pedestrians);
  const { updateSceneGraph } = useHooks();
  const {
    sceneRef,
    pedestrianMeshesRef,
    pedestrianObjsRef,
    transformControlsRef,
  } = useEditorRefs();
  useEffect(() => {
    if (!pedestrianModel) {
      modelCallbacks.push(() => setModelReady(true));
    }
  }, []);

  useEffect(() => {
    if (!modelReady) return;

    const trySync = (attempts = 0) => {
      const scene = sceneRef.current;
      if (!scene) {
        if (attempts < 10) setTimeout(() => trySync(attempts + 1), 300);
        return;
      }

      const tc = transformControlsRef.current;
      const attached = (tc as unknown as { object?: THREE.Object3D })?.object;

      pedestrianMeshesRef.current = pedestrianMeshesRef.current.filter((p) => {
        if (pedestrians.some((pe) => pe.id === p.userData.id)) return true;
        if (attached === p) return true;
        p.traverse((child) => {
          const m = child as THREE.Mesh;
          if (m.isMesh) {
            m.geometry?.dispose();
            (Array.isArray(m.material) ? m.material : [m.material]).forEach(
              (mt) => mt?.dispose(),
            );
          }
        });
        scene.remove(p);
        return false;
      });

      pedestrianObjsRef.current = [...pedestrianMeshesRef.current];

      pedestrians.forEach((ped) => {
        const exists = pedestrianMeshesRef.current.find(
          (p) => p.userData.id === ped.id,
        );
        if (exists) return;
        if (!pedestrianModel) return;

        const modelClone = pedestrianModel.clone(true);
        modelClone.scale.setScalar(0.01);
        modelClone.rotation.x += Math.PI / 2;

        const bbox = new THREE.Box3().setFromObject(modelClone);
        const offsetZ = bbox.min.z ? -bbox.min.z : 0;

        modelClone.userData = { type: 'pedestrian', id: ped.id, offsetZ };
        modelClone.traverse((child) => {
          child.userData = {
            ...child.userData,
            type: 'pedestrian',
            id: ped.id,
          };
        });
        modelClone.position.set(ped.x, ped.y, (ped.z ?? 0) + offsetZ + 0.05);

        scene.add(modelClone);
        pedestrianMeshesRef.current.push(modelClone as THREE.Mesh);
        pedestrianObjsRef.current.push(modelClone as THREE.Mesh);
      });

      updateSceneGraph();
    };

    trySync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pedestrians, modelReady]);
}
