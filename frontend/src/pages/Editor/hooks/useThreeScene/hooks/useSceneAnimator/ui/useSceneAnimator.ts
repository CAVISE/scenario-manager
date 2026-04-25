import { useEffect, useRef } from 'react';
import * as THREE from 'three';

import {
  startAnimate,
  createSpotlightState,
} from '../../../../useOpenDriveUtils/useSpotlight';
import { useEditorStore } from '../../../../../../../store/ui/useEditorStore';
import { UseSceneAnimatorProps } from '../types/useSceneAnimatorTypes';
import { useEditorRefs } from '../../../../../context';

export function useSceneAnimator({
  getIsDragging,
  getOdrMeshes,
  getOpenDriveMap,
  spotlightEnabled = () => true,
}: UseSceneAnimatorProps) {
  const {
    threeRef,
    carMeshesRef,
    pointsObjsRef,
    cubeCirclesRef,
    pedestrianMeshesRef,
  } = useEditorRefs();

  const spotlightStateRef = useRef(createSpotlightState());
  /* eslint-disable react-hooks/exhaustive-deps */
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
      spotlightEnabled,
      spotlightState: spotlightStateRef.current,
      getOpenDriveMap,
      getRoadMesh: () => getOdrMeshes().road_network_mesh,
      getRoadmarksMesh: () => getOdrMeshes().roadmarks_mesh,
      spotlightInfo: document.getElementById('spotlight_info'),

      onBeforeRender: () => {
        if (getIsDragging()) return;

        const { cars, RSUs, buildings, pedestrians, points } =
          useEditorStore.getState();

        cars.forEach((car, i) => {
          const mesh = carMeshesRef.current.find(
            (m) => m.userData.id === car.id,
          );
          if (!mesh) return;
          mesh.position.set(car.x, car.y, car.z);
          mesh.scale.setScalar(car.scale ?? 1);
          mesh.rotation.z = car.rotation ?? 0;

          const circles = cubeCirclesRef.current[i];
          if (!circles) return;
          points
            .filter((p) => p.carId === car.id)
            .forEach((pt, j) => {
              circles[j]?.position.set(pt.x, pt.y, pt.z);
            });
        });

        RSUs.forEach((rsu) => {
          const mesh = pointsObjsRef.current.find(
            (m) => m.userData.id === rsu.id,
          );
          mesh?.position.set(rsu.x, rsu.y, rsu.z);
        });

        buildings.forEach((building) => {
          const mesh = scene.children.find(
            (c) => c.userData.id === building.id,
          );
          if (!mesh) return;
          mesh.position.set(building.x, building.y, building.z);
          mesh.rotation.y = building.rotation ?? 0;
          mesh.scale.setScalar(building.scale ?? 0.5);
        });

        pedestrians.forEach((pedestrian) => {
          const mesh = pedestrianMeshesRef.current.find(
            (p) => p.userData.id === pedestrian.id,
          );
          mesh?.position.set(pedestrian.x, pedestrian.y, pedestrian.z ?? 0);
        });
      },
    });

    return () => {
      handle.running = false;
    };
  }, []);
}
