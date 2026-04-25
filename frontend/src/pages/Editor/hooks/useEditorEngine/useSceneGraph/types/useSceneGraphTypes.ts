import * as THREE from 'three';
export interface SceneNode {
  id: string;
  name: string;
  children?: SceneNode[];
}

export const EXCLUDED_OBJECT_TYPES = new Set([
  'TransformControls',
  'TransformControlsGizmo',
  'TransformControlsPlane',
]);

export const KNOWN_USER_DATA_TYPES = new Set([
  'car',
  'point',
  'building',
  'lidar',
  'pedestrian',
]);

export type KnownUserDataType =
  | 'car'
  | 'point'
  | 'building'
  | 'lidar'
  | 'pedestrian';

export interface KnownUserData {
  type?: string;
  id?: string;
  carId?: string;
}

export function getUserData(obj: THREE.Object3D): KnownUserData {
  return obj.userData as KnownUserData;
}

export function buildSceneGraph(scene: THREE.Scene): SceneNode | null {
  let nodeCounter = 0;
  const visited = new Set<string>();

  const circlesByCarId = new Map<string, SceneNode[]>();
  scene.traverse((obj: THREE.Object3D) => {
    const ud = getUserData(obj);
    if (ud.type === 'circle' && ud.id && ud.carId) {
      const shortId = ud.id.slice(-4);
      const node: SceneNode = { id: ud.id, name: `Point ${shortId}` };
      const arr = circlesByCarId.get(ud.carId) ?? [];
      arr.push(node);
      circlesByCarId.set(ud.carId, arr);
    }
  });

  function traverse(obj: THREE.Object3D): SceneNode | null {
    if (EXCLUDED_OBJECT_TYPES.has(obj.type)) return null;

    const ud = getUserData(obj);

    if (ud.type === 'circle') return null;
    if (ud.type === 'lidar' && getUserData(obj.parent!).type === 'lidar')
      return null;

    const uniqueId = ud.id ?? `node_${nodeCounter++}_${obj.uuid.slice(-8)}`;

    if (visited.has(uniqueId)) return null;
    visited.add(uniqueId);

    const isKnownType = (t: string | undefined): t is KnownUserDataType =>
      KNOWN_USER_DATA_TYPES.has(t ?? '');

    const type = ud.type;
    const known = isKnownType(type);

    const children = obj.children
      .map(traverse)
      .filter((node): node is SceneNode => node !== null);

    if (type === 'car' && ud.id) {
      children.push(...(circlesByCarId.get(ud.id) ?? []));
    }

    if (!known) {
      if (children.length === 0) return null;
      return children.length === 1
        ? children[0]
        : { id: uniqueId, name: obj.name || obj.type, children };
    }

    const shortId = (ud.id ?? obj.uuid).slice(-4);
    const name =
      type === 'car'
        ? `Car ${shortId}`
        : type === 'point'
          ? `RSU ${shortId}`
          : type === 'building'
            ? `Building ${shortId}`
            : type === 'lidar'
              ? `Lidar ${shortId}`
              : type === 'pedestrian'
                ? `Pedestrian ${shortId}`
                : obj.name || obj.type;

    return { id: uniqueId, name, children };
  }

  const children = scene.children
    .map(traverse)
    .filter((node): node is SceneNode => node !== null);

  return children.length > 0 ? { id: 'root', name: 'Scene', children } : null;
}
