import * as THREE from 'three';
import type { MutableRefObject } from 'react';
import { useEditorStore } from '@/store';
import { CreateTransformListenerOptions } from '../types/createTransformListenerTypes';

type MoveKind = 'car' | 'rsu' | 'lidar' | 'building' | 'pedestrian' | 'point';

type ActiveMove = {
  kind: MoveKind;
  id: string;
  before: Record<string, unknown>;
};

const MOVE_LABEL: Record<MoveKind, string> = {
  car: 'Moved car',
  rsu: 'Moved RSU',
  lidar: 'Moved lidar',
  building: 'Moved building',
  pedestrian: 'Moved pedestrian',
  point: 'Moved waypoint',
};

function updaterFor(kind: MoveKind, id: string): (p: object) => void {
  switch (kind) {
    case 'car':
      return (p) => useEditorStore.getState().updateCar(id, p);
    case 'rsu':
      return (p) => useEditorStore.getState().updateRSU(id, p);
    case 'lidar':
      return (p) => useEditorStore.getState().updateLidar(id, p);
    case 'building':
      return (p) => useEditorStore.getState().updateBuilding(id, p);
    case 'pedestrian':
      return (p) => useEditorStore.getState().updatePedestrian(id, p);
    case 'point':
      return (p) => useEditorStore.getState().updatePoint(id, p);
  }
}

function readSnapshot(
  kind: MoveKind,
  id: string
): Record<string, unknown> | null {
  const s = useEditorStore.getState();
  switch (kind) {
    case 'car': {
      const car = s.cars.find((c) => c.id === id);
      if (!car) return null;
      const { x, y, z, rotation, scale } = car;
      return { x, y, z, rotation, scale };
    }
    case 'rsu': {
      const rsu = s.RSUs.find((r) => r.id === id);
      if (!rsu) return null;
      const { x, y, z } = rsu;
      return { x, y, z };
    }
    case 'lidar': {
      const lidar = s.lidars.find((l) => l.id === id);
      if (!lidar) return null;
      const { x, y, z, rotation } = lidar;
      return { x, y, z, rotation };
    }
    case 'building': {
      const building = s.buildings.find((b) => b.id === id);
      if (!building) return null;
      const { x, y, z, rotation, scale, material, height } = building;
      return { x, y, z, rotation, scale, material, height };
    }
    case 'pedestrian': {
      const pedestrian = s.pedestrians.find((p) => p.id === id);
      if (!pedestrian) return null;
      const { x, y, z } = pedestrian;
      return { x, y, z };
    }
    case 'point': {
      const point = s.points.find((p) => p.id === id);
      if (!point) return null;
      const { x, y, z } = point;
      return { x, y, z };
    }
  }
}

function snapshotsDiffer(
  a: Record<string, unknown>,
  b: Record<string, unknown>
): boolean {
  return Object.keys(a).some((key) => a[key] !== b[key]);
}

function resolveAttachedEntity(
  obj: THREE.Object3D,
  carMeshesRef: MutableRefObject<THREE.Mesh[]>,
  cubeCirclesRef: MutableRefObject<THREE.Mesh[][]>
): { kind: MoveKind; id: string } | null {
  const { type, id } = obj.userData;

  if (type === 'car' && id) return { kind: 'car', id };
  if (type === 'point' && id) return { kind: 'rsu', id };
  if (type === 'lidar' && id) return { kind: 'lidar', id };
  if (type === 'building' && id) return { kind: 'building', id };
  if (type === 'pedestrian' && id) {
    const isRoot = !obj.parent || obj.parent.userData.type !== 'pedestrian';
    return isRoot ? { kind: 'pedestrian', id } : null;
  }
  if (type === 'circle') {
    const circles = cubeCirclesRef.current;
    for (let i = 0; i < circles.length; i++) {
      const ci = circles[i].indexOf(obj as THREE.Mesh);
      if (ci === -1) continue;
      const carId = carMeshesRef.current[i]?.userData.id;
      const pt = useEditorStore
        .getState()
        .points.filter((p) => p.carId === carId)[ci];
      return pt ? { kind: 'point', id: pt.id } : null;
    }
  }
  return null;
}

function findMeshForEntity(
  kind: MoveKind,
  id: string,
  scene: THREE.Scene,
  carMeshesRef: MutableRefObject<THREE.Mesh[]>,
  cubeCirclesRef: MutableRefObject<THREE.Mesh[][]>
): THREE.Object3D | null {
  if (kind === 'point') {
    const pt = useEditorStore.getState().points.find((p) => p.id === id);
    if (!pt) return null;
    const carIndex = carMeshesRef.current.findIndex(
      (m) => m.userData.id === pt.carId
    );
    if (carIndex === -1) return null;
    const ci = useEditorStore
      .getState()
      .points.filter((p) => p.carId === pt.carId)
      .findIndex((p) => p.id === id);
    if (ci === -1) return null;
    return cubeCirclesRef.current[carIndex]?.[ci] ?? null;
  }

  const userDataType = kind === 'rsu' ? 'point' : kind;
  let found: THREE.Object3D | null = null;
  scene.traverse((obj) => {
    if (found) return;
    if (obj.userData.type === userDataType && obj.userData.id === id) {
      found = obj;
    }
  });
  return found;
}

export function createTransformListener(
  opts: CreateTransformListenerOptions
): () => void {
  const {
    transformControls,
    sceneRef,
    carMeshesRef,
    cubeCirclesRef,
    carQuaternionsRef,
  } = opts;

  let activeMove: ActiveMove | null = null;

  const commitActiveMove = () => {
    if (!activeMove) return;
    const { kind, id, before } = activeMove;
    activeMove = null;

    const after = readSnapshot(kind, id);
    if (!after) return;
    if (!snapshotsDiffer(before, after)) return;

    const update = updaterFor(kind, id);
    useEditorStore.getState().pushHistoryEntry({
      label: MOVE_LABEL[kind],
      undo: () => update(before),
      redo: () => update(after),
    });
  };

  let rafId: number | null = null;
  const flush = () => {
    rafId = null;
    handler();
  };
  const scheduleFlush = () => {
    if (rafId === null) rafId = requestAnimationFrame(flush);
  };
  const cancelScheduledFlush = () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  };

  const handler = (obj?: THREE.Object3D) => {
    try {
      const target =
        obj ??
        (
          transformControls as unknown as {
            object: THREE.Object3D | undefined;
          }
        ).object;
      if (!target?.userData) return;
      const { type, id } = target.userData;

      if (type === 'car' && id) {
        carQuaternionsRef.current.set(id, target.quaternion.clone());
        useEditorStore.getState().updateCar(id, {
          x: target.position.x,
          y: target.position.y,
          z: target.position.z,
          rotation: target.rotation.z,
          scale: target.scale.x,
        });
      }

      if (type === 'point' && id) {
        useEditorStore.getState().updateRSU(id, {
          x: target.position.x,
          y: target.position.y,
          z: target.position.z,
        });
      }

      if (type === 'lidar' && id) {
        useEditorStore.getState().updateLidar(id, {
          x: target.position.x,
          y: target.position.y,
          z: target.position.z,
          rotation: target.rotation.z,
        });
      }

      if (type === 'building' && id) {
        useEditorStore.getState().updateBuilding(id, {
          x: target.position.x,
          y: target.position.y,
          z: target.position.z,
          rotation: target.rotation.y,
          scale: target.scale.x,
          material: target.userData.material,
          height: target.userData.height,
        });
      }

      if (type === 'pedestrian' && id) {
        const isRoot =
          !target.parent || target.parent.userData.type !== 'pedestrian';
        if (isRoot) {
          const worldPos = new THREE.Vector3();
          target.getWorldPosition(worldPos);
          useEditorStore.getState().updatePedestrian(id, {
            x: worldPos.x,
            y: worldPos.y,
            z: worldPos.z,
          });
        }
      }

      if (type === 'circle') {
        const circles = cubeCirclesRef.current;
        for (let i = 0; i < circles.length; i++) {
          const ci = circles[i].indexOf(target as THREE.Mesh);
          if (ci !== -1) {
            const carId = carMeshesRef.current[i]?.userData.id;
            const pt = useEditorStore
              .getState()
              .points.filter((p) => p.carId === carId)[ci];
            if (pt)
              useEditorStore.getState().updatePoint(pt.id, {
                x: target.position.x,
                y: target.position.y,
                z: target.position.z,
              });
            useEditorStore
              .getState()
              .selectObject({ type: 'point', id: pt?.id || '' });
            break;
          }
        }
      }
    } catch (err) {
      console.error('objectChange error:', err);
    }
  };

  const onDraggingChanged = (e: { value: boolean }) => {
    if (e.value) {
      const obj = (
        transformControls as unknown as { object: THREE.Object3D | undefined }
      ).object;
      const entity = obj
        ? resolveAttachedEntity(obj, carMeshesRef, cubeCirclesRef)
        : null;
      activeMove = entity
        ? (() => {
            const before = readSnapshot(entity.kind, entity.id);
            return before ? { kind: entity.kind, id: entity.id, before } : null;
          })()
        : null;
    } else {
      cancelScheduledFlush();

      const obj = (
        transformControls as unknown as { object: THREE.Object3D | undefined }
      ).object;
      const entity = obj
        ? resolveAttachedEntity(obj, carMeshesRef, cubeCirclesRef)
        : null;
      transformControls.detach();

      handler(obj);
      commitActiveMove();

      if (entity && sceneRef.current) {
        const scene = sceneRef.current;
        setTimeout(() => {
          const mesh = findMeshForEntity(
            entity.kind,
            entity.id,
            scene,
            carMeshesRef,
            cubeCirclesRef
          );
          if (mesh) transformControls.attach(mesh);
        }, 0);
      }
    }
  };

  transformControls.addEventListener('objectChange' as never, scheduleFlush);
  transformControls.addEventListener(
    'dragging-changed' as never,
    onDraggingChanged as never
  );
  return () => {
    cancelScheduledFlush();
    transformControls.removeEventListener(
      'objectChange' as never,
      scheduleFlush
    );
    transformControls.removeEventListener(
      'dragging-changed' as never,
      onDraggingChanged as never
    );
  };
}
