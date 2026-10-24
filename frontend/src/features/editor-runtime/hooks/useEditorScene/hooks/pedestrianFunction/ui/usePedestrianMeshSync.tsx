import { MutableRefObject, useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';
import { TransformControls } from 'three-stdlib';
import { useEditorStore } from '@/store';
import type { Pedestrian } from '@/entities/pedestrian';
import { useHooks, useEditorRefs } from '@editor/context';
import { invalidateEditorScene } from '@editor/lib/invalidateEditorScene';
import {
  ensurePedestrianModel,
  getPedestrianModel,
} from '../utils/pedestrianModel';

function syncPedestrians(
  pedestrians: Pedestrian[],
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
  const pedestrianIds = new Set(pedestrians.map((pedestrian) => pedestrian.id));

  let structuralChange = false;

  pedestrianMeshesRef.current = pedestrianMeshes.filter((p) => {
    if (pedestrianIds.has(p.userData.id)) return true;
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
    structuralChange = true;
    return false;
  });

  pedestrianObjsRef.current = [...pedestrianMeshesRef.current];
  const meshesById = new Map(
    pedestrianMeshesRef.current.map((mesh) => [
      mesh.userData.id as string,
      mesh,
    ])
  );

  pedestrians.forEach((ped) => {
    const exists = meshesById.get(ped.id);
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
    const pedestrianModel = getPedestrianModel();
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
    structuralChange = true;

    const currentMeshes = pedestrianMeshesRef.current;
    if (!currentMeshes) return;
    currentMeshes.push(modelClone as THREE.Mesh);
    meshesById.set(ped.id, modelClone as THREE.Mesh);
    const pedestrianObjs = pedestrianObjsRef.current;
    if (!pedestrianObjs) return;
    pedestrianObjs.push(modelClone as THREE.Mesh);
  });

  if (structuralChange) updateSceneGraph();
  invalidateEditorScene();
}

function queuePedestrianSync(
  queueRef: MutableRefObject<Promise<void>>,
  pedestrians: ReturnType<typeof useEditorStore.getState>['pedestrians'],
  scene: THREE.Scene,
  pedestrianMeshesRef: MutableRefObject<THREE.Mesh[]>,
  pedestrianObjsRef: MutableRefObject<THREE.Mesh[]>,
  transformControlsRef: MutableRefObject<TransformControls | null>,
  isDraggingRef: MutableRefObject<boolean>,
  lastSyncedPedestriansRef: MutableRefObject<Map<string, Pedestrian>>,
  updateSceneGraph: () => void,
  isCurrent: () => boolean
): Promise<void> {
  const sync = async () => {
    if (!isCurrent()) return;
    await ensurePedestrianModel();
    if (!isCurrent()) return;
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
  };
  const next = queueRef.current.catch(console.error).then(sync);
  queueRef.current = next;
  return next;
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
  const syncQueueRef = useRef<Promise<void>>(Promise.resolve());

  useLayoutEffect(() => {
    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const trySync = (attempts = 0) => {
      if (cancelled) return;
      const scene = sceneRef.current;
      if (!scene) {
        if (attempts < 10)
          retryTimer = setTimeout(() => trySync(attempts + 1), 300);
        return;
      }

      const currentPedestrians = useEditorStore.getState().pedestrians;
      queuePedestrianSync(
        syncQueueRef,
        currentPedestrians,
        scene,
        pedestrianMeshesRef,
        pedestrianObjsRef,
        transformControlsRef,
        isDraggingRef,
        lastSyncedPedestriansRef,
        updateSceneGraph,
        () => !cancelled && sceneRef.current === scene
      );
    };
    trySync();

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pedestrians, updateSceneGraph]);
}
