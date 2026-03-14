import { useEffect } from 'react';
import * as THREE from 'three';
import { useEditorStore } from '../../../store/useEditorStore';
import type { UseMouseEventsOptions } from './types/useMouseEventsTypes';

export function useMouseEvents(opts: UseMouseEventsOptions) {
  useEffect(() => {
    const {
      getScene, getCamera, getTransformControls,
      getCarMeshes, getPointsArr, getPointsObjs, getCubeCircles, getRoadMesh,
      modeRef, buildingModelRef,
      onSelectObject, onDetachControls, onDeleteCube, onLoadPoints,
      addCar, addRSU, addPoint, addBuilding,
      updateCar, updatePoint, removeRSU,
      selectObject, setBuildingMode,
      getCurrentColor, getCurrentCar, setCurrentCar, updateSceneGraph
    } = opts;

    const mouse     = new THREE.Vector2();
    const raycaster = new THREE.Raycaster();

    const setMouse = (e: MouseEvent) => {
      mouse.x =  (e.clientX / window.innerWidth)  * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    const insidePanel = (e: MouseEvent) =>
      !!document.querySelector('.MuiDrawer-root')?.contains(e.target as Node);


    const onMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      setMouse(e);
    };

    const onClick = (e: MouseEvent) => {
      const transformControls = getTransformControls();
      if (!transformControls) return;
      const scene = getScene();
      if (!scene) return;
      const camera = getCamera();
      if (!camera) return;
      if (insidePanel(e)) return;
      const road = getRoadMesh();
      if (!road) return;
      e.preventDefault();
      setMouse(e);
      raycaster.setFromCamera(mouse, camera);

      const mode        = modeRef.current;
      const carMeshes   = getCarMeshes();
      const pointsArr   = getPointsArr();
      const cubeCircles = getCubeCircles();

      if (!getCurrentCar()) setCurrentCar('car_' + Math.floor(Math.random() * 1000));

      if (mode.isAddCarModeActive) {
        const hits = raycaster.intersectObjects([...carMeshes, ...pointsArr, road], true);
        if (hits.length > 0 && hits[0].object === road) {
          const pt = hits[0].point;
          addCar(pt.x, pt.y, pt.z, getCurrentCar(), getCurrentColor(), 60);
          mode.isAddCarModeActive = false;
          onLoadPoints();
        }
        return;
      }

      const allLidarMeshes: THREE.Object3D[] = [];
      carMeshes.forEach(wrapper => {
        wrapper.children.forEach(child => {
          if (child.userData.type === 'lidar') allLidarMeshes.push(child);
        });
      });

      const lidarHit = raycaster.intersectObjects(allLidarMeshes, true);
      if (lidarHit.length > 0) {
        let root: THREE.Object3D = lidarHit[0].object;
        while (root.parent && root.userData.type !== 'lidar') root = root.parent;
        selectObject(root.userData.id);
        transformControls.attach(root);
        onSelectObject(null)
        onSelectObject({ type: 'lidar', id: root.userData.id }); 
        return;
      }

      const carHit = raycaster.intersectObjects(carMeshes, true);
      if (carHit.length > 0) {
        let root: THREE.Object3D = carHit[0].object;
        if (root.userData.type === 'lidar') return;
        while (root.parent && root.parent.userData.type === 'car') root = root.parent;
        selectObject(root.userData.id ?? (carHit[0].object as THREE.Mesh).userData.id);
        transformControls.attach(root);
        onSelectObject(null);
        onSelectObject({ type: 'car', id: root.userData.id ?? (carHit[0].object as THREE.Mesh).userData.id });
        return;
      }

      const rsuHit = raycaster.intersectObjects(pointsArr, true);
      if (rsuHit.length > 0) {
        transformControls.detach();
        let root: THREE.Object3D = rsuHit[0].object;
        while (root.parent && !pointsArr.includes(root as THREE.Mesh)) root = root.parent;
        if (root.userData.type !== 'point' && root.parent) root = root.parent;
        transformControls.attach(root);
        const idx   = pointsArr.findIndex(p => p === root);
        const rsuId = idx !== -1 ? useEditorStore.getState().RSUs[idx]?.id : undefined;
        if (rsuId) selectObject(rsuId);
        onSelectObject({ type: 'rsu', id: rsuId, position: root.position });
        return;
      }

      const circleHit = raycaster.intersectObjects(cubeCircles.flat(), true);
      if (circleHit.length > 0) {
        transformControls.detach();
        let best: THREE.Mesh | null = null;
        let bestDist = Infinity;
        cubeCircles.flat().forEach(c => {
          const d = c.position.distanceTo(circleHit[0].point);
          if (d < bestDist) { bestDist = d; best = c; }
        });
        if (best) {
          selectObject(null);
          transformControls.attach(best);
          onSelectObject({ type: 'point', position: (best as THREE.Mesh).position });
        }
        return;
      }

      const buildings = scene.children.filter(c => c.userData.type === 'building');
      const bldHit    = raycaster.intersectObjects(buildings, true);
      if (bldHit.length > 0) {
        transformControls.detach();
        let root: THREE.Object3D = bldHit[0].object;
        while (root.parent && root.userData.type !== 'building') root = root.parent;
        if (root.userData.type === 'building') {
          selectObject(null);
          transformControls.attach(root);
          onSelectObject({ type: 'building', id: root.userData.id, position: root.position });
        }
      }
    };
    
    const onDblClick = (e: MouseEvent) => {
      const transformControls = getTransformControls();
      if (!transformControls) return;
      const scene = getScene();
      if (!scene) return;
      if (insidePanel(e)) return;
      const camera = getCamera();
      if (!camera) return;
      e.preventDefault();
      e.stopPropagation();
      const road = getRoadMesh();
      if (!road) return;
      setMouse(e);
      raycaster.setFromCamera(mouse, camera);

      const mode        = modeRef.current;
      const carMeshes   = getCarMeshes();
      const pointsArr   = getPointsArr();
      const cubeCircles = getCubeCircles();
      const intersects  = raycaster.intersectObjects([...carMeshes, ...cubeCircles.flat(), ...pointsArr]);

      if (mode.isAddPointModeActive) {
        const addAt = (x: number, y: number, z: number) => {
          addRSU(x, y, z);
        };
        if (intersects.length > 0 && intersects[0].object === road) {
          const pt = intersects[0].point;
          addAt(pt.x, pt.y, pt.z);
        } else if (intersects.length === 0) {
          const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
          const pt    = new THREE.Vector3();
          if (raycaster.ray.intersectPlane(plane, pt)) addAt(pt.x, pt.y, pt.z);
        }
        return;
      }


      const currentSelectedId = useEditorStore.getState().selectedId;
      const selectedIdx       = carMeshes.findIndex(m => m.userData.id === currentSelectedId);
      if (selectedIdx >= 0 && mode.isAddedPoints) {
        e.preventDefault();
        const roadHits = raycaster.intersectObjects(
          [...carMeshes, ...cubeCircles.flat(), ...pointsArr, road], true
        );
        if (roadHits.length > 0 && roadHits[0].object === road) {
          if (cubeCircles[selectedIdx]) {
            cubeCircles[selectedIdx].forEach(c => {
              c.parent?.remove(c);
              c.geometry?.dispose();
              (c.material as THREE.Material)?.dispose();
            });
            cubeCircles[selectedIdx] = [];
          }
          const pt = roadHits[0].point;
          if (currentSelectedId) addPoint(currentSelectedId, pt.x, pt.y, pt.z);
          onLoadPoints();
        }
        return;
      }


      const { isBuildingMode } = useEditorStore.getState();
      if (isBuildingMode && !mode.isAddPointModeActive && !mode.isAddedPoints) {
        const model = buildingModelRef.current;
        if (!model) return;
        const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
        const pt    = new THREE.Vector3();
        if (!raycaster.ray.intersectPlane(plane, pt)) return;
        pt.z = 0;
        const mesh = model.clone(true);
        mesh.userData = { type: 'building', id: `building_${Date.now()}` };
        mesh.position.copy(pt);
        scene.add(mesh);
        addBuilding(pt.x, pt.y, pt.z);
        const all       = useEditorStore.getState().buildings;
        mesh.userData.id = all[all.length - 1]?.id;
      }
    };

    const onContextMenu = (e: MouseEvent) => {
      if (insidePanel(e)) return;
      e.preventDefault();
      setBuildingMode(false);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const transformControls = getTransformControls();
      if (!transformControls) return;
      const scene = getScene();
      if (!scene) return;
      const mode        = modeRef.current;
      const carMeshes   = getCarMeshes();
      const pointsArr   = getPointsArr();
      const pointsObjs  = getPointsObjs();
      const cubeCircles = getCubeCircles();

      if (e.key === 'Escape') {
        onSelectObject(null);
        onDetachControls();
        carMeshes.forEach(mesh => {
          updateCar(mesh.userData.id, {
            x:        mesh.position.x,
            y:        mesh.position.y,
            z:        mesh.position.z,
            rotation: mesh.rotation.z,
            scale:    mesh.scale.x,
          });
        });
        cubeCircles.forEach((arr, ai) => {
          const carId = carMeshes[ai]?.userData.id;
          const pts   = useEditorStore.getState().points.filter(p => p.carId === carId);
          arr.forEach((c, pi) => {
            if (pts[pi]) updatePoint(pts[pi].id, { x: c.position.x, y: c.position.y, z: c.position.z });
          });
        });
        onLoadPoints();
        mode.isAddedPoints = false;
        return;
      }

      if (e.key !== 'Delete' && e.key !== 'Backspace') return;

      const tc       = transformControls as unknown as { object: THREE.Mesh | undefined };
      const attached = tc?.object;
      if (!attached) return;
      const type = attached.userData.type;

      if (type === 'car') {
        onDeleteCube();
        onSelectObject(null);
        updateSceneGraph()
        return;
      }

      if (type === 'building') {
        transformControls.detach();
        scene.remove(attached);
        attached.traverse(child => {
          const m = child as THREE.Mesh;
          if (m.isMesh) {
            m.geometry?.dispose();
            (Array.isArray(m.material) ? m.material : [m.material]).forEach(mt => mt?.dispose());
          }
        });
        if (attached.userData.id) useEditorStore.getState().removeBuilding(attached.userData.id);
        onSelectObject(null);
        updateSceneGraph()
        return;
      }

      if (type === 'point') {
        let root: THREE.Object3D = attached;
        while (root.parent && root.userData.type !== 'point') root = root.parent;
        const idx = pointsArr.findIndex(p => p === root);
        if (idx !== -1) {
          transformControls.detach();
          scene.remove(root);
          root.traverse(child => {
            const m = child as THREE.Mesh;
            if (m.isMesh) {
              m.geometry?.dispose();
              (Array.isArray(m.material) ? m.material : [m.material]).forEach(mt => mt?.dispose());
            }
          });
          pointsArr.splice(idx, 1);
          pointsObjs.splice(idx, 1);
          removeRSU(idx);
          onSelectObject(null);
          updateSceneGraph()
        }
        return;
      }

      if (type === 'circle') {
        for (let i = 0; i < cubeCircles.length; i++) {
          const idx = cubeCircles[i].findIndex(c => c === attached);
          if (idx !== -1) {
            transformControls.detach();
            const circle = cubeCircles[i][idx];
            scene.remove(circle);
            circle.geometry?.dispose();
            (circle.material as THREE.Material)?.dispose();
            cubeCircles[i].splice(idx, 1);
            const carId = carMeshes[i]?.userData.id;
            const pts   = useEditorStore.getState().points.filter(p => p.carId === carId);
            if (pts[idx]) useEditorStore.getState().removePoint(pts[idx].id);
            onSelectObject(null);
            onLoadPoints();
            updateSceneGraph()
            break;
          }
        }
      }
    };

    window.addEventListener('mousemove',   onMouseMove);
    window.addEventListener('click',       onClick);
    window.addEventListener('dblclick',    onDblClick);
    window.addEventListener('contextmenu', onContextMenu);
    window.addEventListener('keydown',     onKeyDown);

    return () => {
      window.removeEventListener('mousemove',   onMouseMove);
      window.removeEventListener('click',       onClick);
      window.removeEventListener('dblclick',    onDblClick);
      window.removeEventListener('contextmenu', onContextMenu);
      window.removeEventListener('keydown',     onKeyDown);
    };
  }, []); 
}