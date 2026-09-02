import { MutableRefObject, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader, TransformControls } from 'three-stdlib';
import { useEditorStore } from '@/store';
import { useHooks, useEditorRefs } from '@editor/context';

type Pedestrian = ReturnType<
  typeof useEditorStore.getState
>['pedestrians'][number];

const loader = new GLTFLoader();
let pedestrianModel: THREE.Object3D | null = null;

const ensurePedestrianModel = (): Promise<boolean> => {
  if (pedestrianModel) return Promise.resolve(true);
  return new Promise((resolve) => {
    loader.load(
      '/man_in_suit.glb',
      (gltf) => {
        pedestrianModel = gltf.scene;
        resolve(true);
      },
      undefined,
      () => resolve(false)
    );
  });
};

let pedestrianSyncQueue: Promise<void> = Promise.resolve();

function syncPedestrians(
  pedestrians: ReturnType<typeof useEditorStore.getState>['pedestrians'],
  scene: THREE.Scene,
  pedestrianMeshesRef: MutableRefObject<THREE.Mesh[]>,
  pedestrianObjsRef: MutableRefObject<THREE.Mesh[]>,
  transformControlsRef: MutableRefObject<TransformControls | null>,
  isDraggingRef: MutableRefObject<boolean>,
  lastSyncedPedestriansRef: MutableRefObject<Map<string, Pedestrian>>,
  updateSceneGraph: () => void
) {
  const tc = transformControlsRef.current;
  const attached = (tc as unknown as { object?: THREE.Object3D })?.object;
  const pedestrianMeshes = pedestrianMeshesRef.current;
  if (!pedestrianMeshes) return;
  pedestrianMeshesRef.current = pedestrianMeshes.filter((p) => {
    if (pedestrians.some((pe) => pe.id === p.userData.id)) return true;
    if (attached && (attached === p || p.getObjectById(attached.id)))
      return true;
    p.traverse((child) => {
      const m = child as THREE.Mesh;
      if (m.isMesh) {
        m.geometry?.dispose();
        (Array.isArray(m.material) ? m.material : [m.material]).forEach((mt) =>
          mt?.dispose()
        );
      }
    });
    scene.remove(p);
    lastSyncedPedestriansRef.current.delete(p.userData.id);
    return false;
  });

  pedestrianObjsRef.current = [...pedestrianMeshesRef.current];

  pedestrians.forEach((ped) => {
    const exists = pedestrianMeshes.find((p) => p.userData.id === ped.id);
    if (exists) {
      if (lastSyncedPedestriansRef.current.get(ped.id) === ped) return;
      lastSyncedPedestriansRef.current.set(ped.id, ped);

      const attachedHere =
        !!attached &&
        (attached === exists || !!exists.getObjectById(attached.id));

      if (!(attachedHere && isDraggingRef.current)) {
        const offsetZ = (exists.userData as { offsetZ?: number })?.offsetZ ?? 0;
        exists.position.set(ped.x, ped.y, (ped.z ?? 0) + offsetZ + 0.05);
      }
      return;
    }
    if (!pedestrianModel) return;

    const modelClone = pedestrianModel.clone(true);
    modelClone.scale.setScalar(0.03);
    modelClone.rotation.x += Math.PI / 2;

    const bbox = new THREE.Box3().setFromObject(modelClone);
    const offsetZ = bbox.min.z ? -bbox.min.z : 0;

    modelClone.userData = { type: 'pedestrian', id: ped.id, offsetZ };
    modelClone.traverse((child) => {
      child.userData = { ...child.userData, type: 'pedestrian', id: ped.id };
    });
    modelClone.position.set(ped.x, ped.y, (ped.z ?? 0) + offsetZ + 0.05);

    scene.add(modelClone);
    lastSyncedPedestriansRef.current.set(ped.id, ped);

    const currentMeshes = pedestrianMeshesRef.current;
    if (!currentMeshes) return;
    currentMeshes.push(modelClone as THREE.Mesh);
    const pedestrianObjs = pedestrianObjsRef.current;
    if (!pedestrianObjs) return;
    pedestrianObjs.push(modelClone as THREE.Mesh);
  });

  updateSceneGraph();
}

function queuePedestrianSync(
  pedestrians: ReturnType<typeof useEditorStore.getState>['pedestrians'],
  scene: THREE.Scene,
  pedestrianMeshesRef: MutableRefObject<THREE.Mesh[]>,
  pedestrianObjsRef: MutableRefObject<THREE.Mesh[]>,
  transformControlsRef: MutableRefObject<TransformControls | null>,
  isDraggingRef: MutableRefObject<boolean>,
  lastSyncedPedestriansRef: MutableRefObject<Map<string, Pedestrian>>,
  updateSceneGraph: () => void
): Promise<void> {
  pedestrianSyncQueue = pedestrianSyncQueue.then(() =>
    ensurePedestrianModel().then(() => {
      syncPedestrians(
        pedestrians,
        scene,
        pedestrianMeshesRef,
        pedestrianObjsRef,
        transformControlsRef,
        isDraggingRef,
        lastSyncedPedestriansRef,
        updateSceneGraph
      );
    })
  );
  return pedestrianSyncQueue;
}

export function usePedestrianMeshSync() {
  const pedestrians = useEditorStore((s) => s.pedestrians);
  const { updateSceneGraph } = useHooks();
  const {
    sceneRef,
    pedestrianMeshesRef,
    pedestrianObjsRef,
    transformControlsRef,
    isDraggingRef,
  } = useEditorRefs();
  const lastSyncedPedestriansRef = useRef<Map<string, Pedestrian>>(new Map());

  useEffect(() => {
    let cancelled = false;

    const trySync = (attempts = 0) => {
      const scene = sceneRef.current;
      if (!scene) {
        if (attempts < 10) setTimeout(() => trySync(attempts + 1), 300);
        return;
      }
      if (cancelled) return;

      const currentPedestrians = useEditorStore.getState().pedestrians;
      queuePedestrianSync(
        currentPedestrians,
        scene,
        pedestrianMeshesRef,
        pedestrianObjsRef,
        transformControlsRef,
        isDraggingRef,
        lastSyncedPedestriansRef,
        updateSceneGraph
      );
    };
    trySync();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pedestrians, updateSceneGraph]);
}
