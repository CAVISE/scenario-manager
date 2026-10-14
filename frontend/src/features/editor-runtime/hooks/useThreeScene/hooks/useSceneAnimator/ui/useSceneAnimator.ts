import { useEditorRefs } from '@editor/context';
import {
  createSpotlightState,
  startAnimate,
} from '@editor/hooks/useOpenDriveUtils/useSpotlight';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { UseSceneAnimatorProps } from '../types/useSceneAnimatorTypes';

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

    const { renderer, scene, camera, controls, picking } = three;
    const mouse = new THREE.Vector2();

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
    });

    return () => {
      handle.running = false;
    };
  }, [threeRef]);
}
