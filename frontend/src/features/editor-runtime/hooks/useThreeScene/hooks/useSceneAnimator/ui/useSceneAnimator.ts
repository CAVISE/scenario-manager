import { useEditorRefs } from '@editor/context';
import {
  createSpotlightState,
  startAnimate,
} from '@editor/hooks/useOpenDriveUtils/useSpotlight';
import { createScenePerformanceMonitor } from '@editor/hooks/useOpenDriveUtils/useSpotlight/utils/scenePerformanceMonitor';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { UseSceneAnimatorProps } from '../types/useSceneAnimatorTypes';
import { editorSceneInvalidationEvent } from '@editor/lib/invalidateEditorScene';

export function useSceneAnimator({
  getOdrMeshes,
  getOpenDriveMap,
  spotlightEnabled = () => true,
}: UseSceneAnimatorProps) {
  const { threeRef } = useEditorRefs();

  const spotlightStateRef = useRef(createSpotlightState());
  const callbacksRef = useRef({
    getOdrMeshes,
    getOpenDriveMap,
    spotlightEnabled,
  });
  callbacksRef.current = { getOdrMeshes, getOpenDriveMap, spotlightEnabled };

  useEffect(() => {
    const three = threeRef.current;
    if (!three) return;

    const { renderer, scene, camera, controls, picking, transformControls } =
      three;
    const mouse = new THREE.Vector2();
    const performanceMonitor = import.meta.env.DEV
      ? createScenePerformanceMonitor()
      : undefined;
    const devWindow = window as Window & {
      __editorPerformanceMetrics?: typeof performanceMonitor;
    };
    if (performanceMonitor) {
      devWindow.__editorPerformanceMetrics = performanceMonitor;
    }

    const handle = startAnimate({
      renderer,
      scene,
      camera,
      controls,
      mouse,
      picking,
      spotlightEnabled: () => callbacksRef.current.spotlightEnabled(),
      spotlightState: spotlightStateRef.current,
      getOpenDriveMap: () => callbacksRef.current.getOpenDriveMap(),
      getRoadMesh: () => callbacksRef.current.getOdrMeshes().road_network_mesh,
      getRoadmarksMesh: () =>
        callbacksRef.current.getOdrMeshes().roadmarks_mesh,
      spotlightInfo: document.getElementById('spotlight_info'),
      performanceMonitor,
    });
    const invalidate = () => handle.invalidate();
    transformControls.addEventListener('change' as never, invalidate);
    window.addEventListener(editorSceneInvalidationEvent, invalidate);

    return () => {
      transformControls.removeEventListener('change' as never, invalidate);
      window.removeEventListener(editorSceneInvalidationEvent, invalidate);
      handle.stop();
      if (
        performanceMonitor &&
        devWindow.__editorPerformanceMetrics === performanceMonitor
      ) {
        delete devWindow.__editorPerformanceMetrics;
      }
    };
  }, [threeRef]);
}
