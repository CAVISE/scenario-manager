import type * as THREE from 'three';
import {
  EXCLUDED_OBJECT_TYPES,
  KNOWN_USER_DATA_TYPES,
} from '../constants/sceneGraphConstants';
import type {
  KnownUserData,
  KnownUserDataType,
  SceneNode,
} from '../types/useSceneGraphTypes';

export function getUserData(obj: THREE.Object3D): KnownUserData {
  return obj.userData as KnownUserData;
}

export function buildSceneGraph(scene: THREE.Scene): SceneNode | null {
  let nodeCounter = 0;
  const visited = new Set<string>();
  const routePointsByCarId = new Map<string, SceneNode[]>();

  scene.traverse((obj: THREE.Object3D) => {
    const data = getUserData(obj);
    if (data.type === 'route-point' && data.id && data.carId) {
      const nodes = routePointsByCarId.get(data.carId) ?? [];
      nodes.push({ id: data.id, name: `Point ${data.id.slice(-4)}` });
      routePointsByCarId.set(data.carId, nodes);
    }
  });

  function traverse(obj: THREE.Object3D): SceneNode | null {
    if (EXCLUDED_OBJECT_TYPES.has(obj.type)) return null;

    const data = getUserData(obj);
    if (data.type === 'route-point') return null;
    if (data.type === 'lidar' && obj.parent?.userData.type === 'lidar') {
      return null;
    }

    const uniqueId = data.id ?? `node_${nodeCounter++}_${obj.uuid.slice(-8)}`;
    if (visited.has(uniqueId)) return null;
    visited.add(uniqueId);

    const isKnownType = (
      value: string | undefined
    ): value is KnownUserDataType => KNOWN_USER_DATA_TYPES.has(value ?? '');

    const children = obj.children
      .map(traverse)
      .filter((node): node is SceneNode => node !== null);

    if (data.type === 'car' && data.id) {
      children.push(...(routePointsByCarId.get(data.id) ?? []));
    }

    if (!isKnownType(data.type)) {
      if (children.length === 0) return null;
      return children.length === 1
        ? children[0]
        : { id: uniqueId, name: obj.name || obj.type, children };
    }

    const shortId = (data.id ?? obj.uuid).slice(-4);
    const labels: Record<KnownUserDataType, string> = {
      car: 'Car',
      rsu: 'RSU',
      building: 'Building',
      lidar: 'Lidar',
      pedestrian: 'Pedestrian',
    };

    return { id: uniqueId, name: `${labels[data.type]} ${shortId}`, children };
  }

  const children = scene.children
    .map(traverse)
    .filter((node): node is SceneNode => node !== null);

  return children.length > 0 ? { id: 'root', name: 'Scene', children } : null;
}
