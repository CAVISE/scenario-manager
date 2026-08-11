import { useEffect, useRef } from 'react';
import * as THREE from 'three';

import { startAnimate, createSpotlightState } from '../../useSpotlight';
import { useEditorStore } from '../../../../../store/useEditorStore';
import { UseSceneAnimatorProps } from './useSceneAnimator.types';
import { useEditorRefs } from '../../../context';

function createIdIndexCache<T extends THREE.Object3D>() {
  let lastArray: T[] | null = null;
  let cache: Map<string, T> = new Map();

  return (array: T[]): Map<string, T> => {
    if (array !== lastArray) {
      cache = new Map(array.map((item) => [String(item.userData.id), item]));
      lastArray = array;
    }
    return cache;
  };
}

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
  const carMeshIndexRef = useRef(createIdIndexCache<THREE.Mesh>());
  const rsuMeshIndexRef = useRef(createIdIndexCache<THREE.Mesh>());
  const pedestrianMeshIndexRef = useRef(createIdIndexCache<THREE.Mesh>());

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

        const carMeshById = carMeshIndexRef.current(carMeshesRef.current);
        cars.forEach((car, i) => {
          const mesh = carMeshById.get(car.id);
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

        const rsuMeshById = rsuMeshIndexRef.current(pointsObjsRef.current);
        RSUs.forEach((rsu) => {
          const mesh = rsuMeshById.get(rsu.id);
          mesh?.position.set(rsu.x, rsu.y, rsu.z);
        });

        const buildingMeshById = new Map<string, THREE.Object3D>();
        scene.children.forEach((c) => {
          if (c.userData.type === 'building') {
            buildingMeshById.set(String(c.userData.id), c);
          }
        });
        buildings.forEach((building) => {
          const mesh = buildingMeshById.get(building.id);
          if (!mesh) return;
          mesh.position.set(building.x, building.y, building.z);
          mesh.rotation.y = building.rotation ?? 0;
          mesh.scale.setScalar(building.scale ?? 0.5);
        });

        const pedestrianMeshById = pedestrianMeshIndexRef.current(
          pedestrianMeshesRef.current,
        );
        pedestrians.forEach((pedestrian) => {
          const mesh = pedestrianMeshById.get(pedestrian.id);
          mesh?.position.set(pedestrian.x, pedestrian.y, pedestrian.z ?? 0);
        });
      },
    });

    return () => {
      handle.stop();
    };
  }, []);
}
