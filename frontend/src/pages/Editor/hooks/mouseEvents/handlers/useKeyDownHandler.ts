import { useCallback } from 'react';
import * as THREE from 'three';
import { useEditorStore } from '../../../../../store';
import { useHooks, useEditorRefs } from '../../../context';

export function useKeyDownHandler() {
  const { updateSceneGraph } = useHooks();
  const {
    sceneRef,
    carMeshesRef,
    transformControlsRef,
    pointsArrRef,
    rsuMeshesRef,
    pointsObjsRef,
    cubeCirclesRef,
    modeRef,
    loadPointsRef,
  } = useEditorRefs();
  const onSelectObject = useEditorStore((s) => s.selectObject);

  return useCallback(
    (e: KeyboardEvent) => {
      const transformControls = transformControlsRef.current;
      if (!transformControls) return;
      const scene = sceneRef.current;
      if (!scene) return;
      const mode = modeRef.current;
      const carMeshes = carMeshesRef.current;
      const pointsArr = pointsArrRef.current;
      const pointsObjs = pointsObjsRef.current;
      const rsuMeshes = rsuMeshesRef.current;
      const cubeCircles = cubeCirclesRef.current;

      if (e.key === 'Escape') {
        onSelectObject(null);
        transformControlsRef.current?.detach();
        carMeshes.forEach((mesh) => {
          useEditorStore.getState().updateCar(mesh.userData.id, {
            x: mesh.position.x,
            y: mesh.position.y,
            z: mesh.position.z,
            rotation: mesh.rotation.z,
            scale: mesh.scale.x,
          });
        });
        cubeCircles.forEach((arr, ai) => {
          const carId = carMeshes[ai]?.userData.id;
          const pts = useEditorStore
            .getState()
            .points.filter((p) => p.carId === carId);
          arr.forEach((c, pi) => {
            if (pts[pi])
              useEditorStore.getState().updatePoint(pts[pi].id, {
                x: c.position.x,
                y: c.position.y,
                z: c.position.z,
              });
          });
        });
        loadPointsRef.current();
        mode.isAddedPoints = false;
        return;
      }

      if (e.key !== 'Delete' && e.key !== 'Backspace') return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        (e.target as HTMLElement)?.isContentEditable
      )
        return;
      const tc = transformControls as unknown as {
        object: THREE.Mesh | undefined;
      };
      const attached = tc?.object;
      if (!attached) return;
      const type = attached.userData.type;

      if (type === 'car') {
        transformControls.detach();
        scene.remove(attached);
        attached.traverse((child) => {
          const m = child as THREE.Mesh;
          if (m.isMesh) {
            m.geometry?.dispose();
            (Array.isArray(m.material) ? m.material : [m.material]).forEach(
              (mt) => mt?.dispose(),
            );
          }
        });
        const carIdx = carMeshes.findIndex((m) => m === attached);
        if (carIdx !== -1) {
          carMeshes.splice(carIdx, 1);
          cubeCircles[carIdx]?.forEach((c) => {
            scene.remove(c);
            c.geometry?.dispose();
            (c.material as THREE.Material)?.dispose();
          });
          cubeCircles.splice(carIdx, 1);
        }
        if (attached.userData.id) {
          useEditorStore.getState().removeCar(attached.userData.id);
        }
        onSelectObject(null);
        updateSceneGraph();
        return;
      }

      if (type === 'building') {
        transformControls.detach();
        scene.remove(attached);
        attached.traverse((child) => {
          const m = child as THREE.Mesh;
          if (m.isMesh) {
            m.geometry?.dispose();
            (Array.isArray(m.material) ? m.material : [m.material]).forEach(
              (mt) => mt?.dispose(),
            );
          }
        });
        if (attached.userData.id)
          useEditorStore.getState().removeBuilding(attached.userData.id);
        onSelectObject(null);
        updateSceneGraph();
        return;
      }

      if (type === 'point') {
        let root: THREE.Object3D = attached;
        while (root.parent && root.userData.type !== 'point')
          root = root.parent;
        const idx = pointsArr.findIndex((p) => p === root);
        if (idx !== -1) {
          transformControls.detach();
          scene.remove(root);
          root.traverse((child) => {
            const m = child as THREE.Mesh;
            if (m.isMesh) {
              m.geometry?.dispose();
              (Array.isArray(m.material) ? m.material : [m.material]).forEach(
                (mt) => mt?.dispose(),
              );
            }
          });
          pointsArr.splice(idx, 1);
          pointsObjs.splice(idx, 1);
          const rsuMeshIdx = rsuMeshes.findIndex((p) => p === root);
          if (rsuMeshIdx !== -1) rsuMeshes.splice(rsuMeshIdx, 1);
          const rsuId = root.userData.id as string | undefined;
          if (rsuId) {
            const storeIdx = useEditorStore
              .getState()
              .RSUs.findIndex((r) => r.id === rsuId);
            if (storeIdx !== -1) useEditorStore.getState().removeRSU(storeIdx);
          }
          onSelectObject(null);
          updateSceneGraph();
        }
        return;
      }

      if (type === 'pedestrian' && attached.userData.id) {
        transformControls.detach();
        scene.remove(attached);
        attached.traverse((child) => {
          const m = child as THREE.Mesh;
          if (m.isMesh) {
            m.geometry?.dispose();
            (Array.isArray(m.material) ? m.material : [m.material]).forEach(
              (mt) => mt?.dispose(),
            );
          }
        });
        useEditorStore.getState().removePedestrian(attached.userData.id);
        onSelectObject(null);
        updateSceneGraph();
        return;
      }

      if (type === 'circle') {
        for (let i = 0; i < cubeCircles.length; i++) {
          const idx = cubeCircles[i].findIndex((c) => c === attached);
          if (idx !== -1) {
            transformControls.detach();
            const circle = cubeCircles[i][idx];
            scene.remove(circle);
            circle.geometry?.dispose();
            (circle.material as THREE.Material)?.dispose();
            cubeCircles[i].splice(idx, 1);
            const carId = carMeshes[i]?.userData.id;
            const pts = useEditorStore
              .getState()
              .points.filter((p) => p.carId === carId);
            if (pts[idx]) useEditorStore.getState().removePoint(pts[idx].id);
            onSelectObject(null);
            loadPointsRef.current();
            updateSceneGraph();
            break;
          }
        }
      }
    },
    [
      sceneRef,
      transformControlsRef,
      carMeshesRef,
      pointsArrRef,
      pointsObjsRef,
      rsuMeshesRef,
      cubeCirclesRef,
      modeRef,
      loadPointsRef,
      updateSceneGraph,
      onSelectObject,
    ],
  );
}
