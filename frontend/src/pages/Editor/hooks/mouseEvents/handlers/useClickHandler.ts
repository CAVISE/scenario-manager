import { useCallback } from 'react';
import * as THREE from 'three';
import { useEditorStore } from '../../../../../store';
import type { SharedMouseContext } from '../types/IMouseEventsTypes';
import { useEditorRefs } from '../../../context';

export function useClickHandler(ctx: SharedMouseContext) {
  const {
    sceneRef,
    transformControlsRef,
    cameraRef,
    roadMeshRef,
    carMeshesRef,
    pointsArrRef,
    cubeCirclesRef,
    modeRef,
    currentCarRef,
    currentColorRef,
    loadPointsRef,
    rsuMeshesRef,
    pedestrianMeshesRef,
  } = useEditorRefs();
  const onSelectObject = useEditorStore((s) => s.selectObject);
  return useCallback((e: MouseEvent) => {
    const transformControls = transformControlsRef.current;
    if (!transformControls) return;
    const scene = sceneRef.current;
    if (!scene) return;
    const camera = cameraRef.current;
    if (!camera) return;
    if (ctx.insidePanel(e)) return;
    const road = roadMeshRef.current;
    if (!road) return;
    e.preventDefault();
    ctx.setMouse(e);
    ctx.raycaster.setFromCamera(ctx.mouse, camera);

    const mode = modeRef.current;
    const carMeshes = carMeshesRef.current;
    const pointsArr = pointsArrRef.current;
    const cubeCircles = cubeCirclesRef.current;

    if (!currentCarRef.current)
      currentCarRef.current = 'car_' + Math.floor(Math.random() * 1000);

    if (mode.isAddCarModeActive) {
      const hits = ctx.raycaster.intersectObjects(
        [...carMeshes, ...pointsArr, road],
        true,
      );
      if (hits.length > 0 && hits[0].object === road) {
        const pt = hits[0].point;
        useEditorStore
          .getState()
          .addCar(
            pt.x,
            pt.y,
            pt.z,
            currentCarRef.current,
            currentColorRef.current,
            60,
          );
        mode.isAddCarModeActive = false;
        loadPointsRef.current();
      }
      return;
    }

    const allLidarMeshes: THREE.Object3D[] = [];
    carMeshes.forEach((wrapper) => {
      wrapper.children.forEach((child) => {
        if (child.userData.type === 'lidar') allLidarMeshes.push(child);
      });
    });

    const lidarHit = ctx.raycaster.intersectObjects(allLidarMeshes, true);
    if (lidarHit.length > 0) {
      let root: THREE.Object3D = lidarHit[0].object;
      while (root.parent && root.userData.type !== 'lidar') root = root.parent;
      useEditorStore
        .getState()
        .selectObject({ type: 'lidar', id: root.userData.id });
      transformControls.attach(root);
      onSelectObject(null);
      onSelectObject({ type: 'lidar', id: root.userData.id });
      return;
    }

    const carHit = ctx.raycaster.intersectObjects(carMeshes, true);
    if (carHit.length > 0) {
      let root: THREE.Object3D = carHit[0].object;
      if (root.userData.type === 'lidar') return;
      while (root.parent && root.parent.userData.type === 'car')
        root = root.parent;
      useEditorStore.getState().selectObject({
        type: 'car',
        id: root.userData.id ?? (carHit[0].object as THREE.Mesh).userData.id,
      });
      transformControls.attach(root);
      onSelectObject(null);
      onSelectObject({
        type: 'car',
        id: root.userData.id ?? (carHit[0].object as THREE.Mesh).userData.id,
      });
      return;
    }

    const rsuMeshes = rsuMeshesRef.current;
    const rsuHit = ctx.raycaster.intersectObjects(rsuMeshes, true);
    if (rsuHit.length > 0) {
      transformControls.detach();
      let root: THREE.Object3D = rsuHit[0].object;
      while (root.parent && !rsuMeshes.includes(root as THREE.Mesh)) {
        root = root.parent;
      }
      const rsuId: string | undefined = root.userData.id;
      if (rsuId)
        useEditorStore.getState().selectObject({ type: 'rsu', id: rsuId });
      transformControls.attach(root);
      onSelectObject({ type: 'rsu', id: rsuId, position: root.position });
      return;
    }

    const circleHit = ctx.raycaster.intersectObjects(cubeCircles.flat(), true);
    if (circleHit.length > 0) {
      transformControls.detach();
      let best: THREE.Mesh | null = null;
      let bestDist = Infinity;
      cubeCircles.flat().forEach((c) => {
        const d = c.position.distanceTo(circleHit[0].point);
        if (d < bestDist) {
          bestDist = d;
          best = c;
        }
      });
      if (best) {
        let pointId: string | undefined;
        for (let i = 0; i < cubeCircles.length; i++) {
          const j = cubeCircles[i].indexOf(best as THREE.Mesh);
          if (j !== -1) {
            const carId = carMeshesRef.current[i]?.userData.id;
            const pt = useEditorStore
              .getState()
              .points.filter((p) => p.carId === carId)[j];
            pointId = pt?.id;
            break;
          }
        }
        useEditorStore
          .getState()
          .selectObject(pointId ? { type: 'point', id: pointId } : null);

        transformControls.attach(best);
        onSelectObject({
          type: 'point',
          id: pointId,
          position: (best as THREE.Mesh).position,
        });
      }
      return;
    }

    const pedestrians = pedestrianMeshesRef.current;
    const pedHit = ctx.raycaster.intersectObjects(pedestrians, true);
    if (pedHit.length > 0) {
      transformControls.detach();
      let root: THREE.Object3D = pedHit[0].object;
      while (root.parent && root.parent.userData.type === 'pedestrian')
        root = root.parent;
      if (root.userData.type === 'pedestrian') {
        useEditorStore
          .getState()
          .selectObject({ type: 'pedestrian', id: root.userData.id });
        transformControls.attach(root);
        onSelectObject({
          type: 'pedestrian',
          id: root.userData.id,
          position: root.position,
        });
      }
      return;
    }

    const buildings = scene.children.filter(
      (c) => c.userData.type === 'building',
    );
    const bldHit = ctx.raycaster.intersectObjects(buildings, true);
    if (bldHit.length > 0) {
      transformControls.detach();
      let root: THREE.Object3D = bldHit[0].object;
      while (root.parent && root.userData.type !== 'building')
        root = root.parent;
      if (root.userData.type === 'building') {
        const bid = root.userData.id as string | undefined;
        useEditorStore
          .getState()
          .selectObject(bid ? { type: 'building', id: bid } : null);
        transformControls.attach(root);
        onSelectObject(null);
        onSelectObject({ type: 'building', id: bid, position: root.position });
      }
      return;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
