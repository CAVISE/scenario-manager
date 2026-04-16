import { useState, useCallback, useRef, useEffect } from 'react';
import * as THREE from 'three';
import type { SceneNode } from './types/useSceneGraphTypes';

export function useSceneGraph(
  sceneRef: React.MutableRefObject<THREE.Scene | undefined>
) {
  const [sceneGraph, setSceneGraph] = useState<SceneNode | null>(null);
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, []);

  const updateSceneGraph = useCallback(() => {
    if (rafIdRef.current !== null) return;

    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = null;

    const scene = sceneRef.current;
    if (!scene) return;

    let nodeCounter = 0;
    const visited = new Set<string>();

    const circlesByCarId = new Map<string, SceneNode[]>();
    scene.traverse((obj: THREE.Object3D) => {
      if (obj.userData.type === 'circle' && obj.userData.id && obj.userData.carId) {
        const shortId = obj.userData.id.slice(-4);
        const node: SceneNode = { id: obj.userData.id, name: `Point ${shortId}` };
        const arr = circlesByCarId.get(obj.userData.carId) ?? [];
        arr.push(node);
        circlesByCarId.set(obj.userData.carId, arr);
      }
    });

    function traverse(obj: THREE.Object3D): SceneNode | null {
      if (obj.type === 'TransformControls') return null;
      if (obj.type === 'TransformControlsGizmo') return null;
      if (obj.type === 'TransformControlsPlane') return null;
      if (obj.userData.type === 'circle') return null;
      if (obj.userData.type === 'lidar' && obj.parent?.userData.type === 'lidar') return null;

      const isCar        = obj.userData.type === 'car';
      const isPoint      = obj.userData.type === 'point';
      const isBuilding   = obj.userData.type === 'building';
      const isLidar      = obj.userData.type === 'lidar';
      const isPedestrian = obj.userData.type === 'pedestrian';
      const uniqueId = obj.userData.id
        ? obj.userData.id
        : `node_${nodeCounter++}_${obj.uuid.slice(-4)}`;

      if (visited.has(uniqueId)) return null;
      visited.add(uniqueId);

      const children = obj.children
        .map(traverse)
        .filter((node): node is SceneNode => node !== null);

      if (isCar && obj.userData.id) {
        const circles = circlesByCarId.get(obj.userData.id) ?? [];
        children.push(...circles);
      }

      if (!isCar && !isPoint && !isBuilding && !isLidar && !isPedestrian && children.length === 0) return null;

      if (!isCar && !isPoint && !isBuilding && !isLidar && !isPedestrian && children.length > 0) {
        return children.length === 1 ? children[0] : { id: uniqueId, name: obj.name || obj.type, children };
      }

      const shortId = obj.userData.id?.slice(-4) ?? obj.uuid.slice(-4);
      const name = isCar        ? `Car ${shortId}`
                 : isPoint      ? `RSU ${shortId}`
                 : isBuilding   ? `Building ${shortId}`
                 : isLidar      ? `Lidar ${shortId}`
                 : isPedestrian ? `Pedestrian ${shortId}`
                 : obj.name || obj.type;

      return { id: uniqueId, name, children };
    }

    const children = scene.children
      .map(traverse)
      .filter((node): node is SceneNode => node !== null);

    setSceneGraph(children.length > 0 
      ? { id: 'root', name: 'Scene', children } 
      : null
    );
    });
  }, [sceneRef]);

  return { sceneGraph, updateSceneGraph };
}