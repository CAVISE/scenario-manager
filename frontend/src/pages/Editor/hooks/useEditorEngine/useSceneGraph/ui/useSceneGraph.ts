import { useState, useCallback, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { buildSceneGraph, type SceneNode } from '../types/useSceneGraphTypes';

export function useSceneGraph(
  sceneRef: React.MutableRefObject<THREE.Scene | undefined>,
) {
  const [sceneGraph, setSceneGraph] = useState<SceneNode | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [sceneRef]);

  const updateSceneGraph = useCallback(() => {
    if (rafIdRef.current !== null) return;

    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = null;

      if (!isMountedRef.current) return;

      const scene = sceneRef.current;
      if (!scene) return;

      const graph = buildSceneGraph(scene);
      setSceneGraph(graph);
    });
  }, [sceneRef]);

  return { sceneGraph, updateSceneGraph };
}
