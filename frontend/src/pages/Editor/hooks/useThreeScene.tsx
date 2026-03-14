import { useEffect, useRef } from 'react';
import * as THREE from 'three';

import { loadRSU    as _loadRSU    } from '../scene/loadRSU';
import { loadPoints as _loadPoints } from '../scene/loadPoints';
import { useEditorStore }            from '../../../store/useEditorStore';

import { createThreeSetup }                                 from './useThreeSetup';
import { createOdrMaterials, clearOdrScene, buildOdrScene } from './useOdrMap';
import { startAnimate, createSpotlightState }               from './useSpotlight';
import { fitViewToObj }                                     from '../scene/sceneHelpers';

import type { OdrMapMeshes, OpenDriveModule }  from './types/useOdrMapTypes';
import type { OpenDriveMapInstance, SelectedObject } from '../types/editorTypes';
import { libOpenDrive } from '../types/editorTypes';

import type { UseThreeSceneOptions, UseThreeSceneResult } from './types/useThreeSceneTypes';

let localLineArr: THREE.Line[][] = [];

export function useThreeScene(opts: UseThreeSceneOptions): UseThreeSceneResult {
  const {
    sceneRef, cameraRef, transformControlsRef,
    carMeshesRef, carQuaternionsRef,
    pointsArrRef, pointsObjsRef, cubeCirclesRef, roadMeshRef,
    currentCarRef, currentColorRef, loadPointsRef,
    modeRef, buildingModelRef,
    setStep, updateSceneGraph, setSelectedObject, updateCar, deleteCar, selectObject,
    updateRSU, removePointsByCarId, updatePoint, setBuildingMode, setError,
  } = opts;

  const actionsRef = useRef({
    addCube:    () => {},
    addRSU:     () => {},
    addPoints:  () => {},
    deleteCar:  () => {},
    deleteCube: () => {},
  });

  useEffect(() => {
    const spotlightState = createSpotlightState();

    let setup: ReturnType<typeof createThreeSetup>['setup'];
    let disposeThree: () => void;

    try {
      const result = createThreeSetup('ThreeJS', (paused) => {
        spotlightState.paused = paused;
      });
      setup        = result.setup;
      disposeThree = result.dispose;
    } catch (err) {
      setStep('done');
      setError?.(err instanceof Error ? err : new Error('WebGL initialization failed'));
      return;
    }

    const { renderer, scene, camera, controls, transformControls, light, picking } = setup;

    sceneRef.current             = scene;
    cameraRef.current            = camera;
    transformControlsRef.current = transformControls;
    updateSceneGraph();

    const odrMaterials    = createOdrMaterials();
    const disposable_objs: THREE.BufferGeometry[] = [];
    let points_objs: THREE.Mesh[] = [];
    let points_arr:  THREE.Mesh[] = [];
    let cubeCircles: THREE.Mesh[][] = [];

    let ModuleOpenDrive: OpenDriveModule | null      = null;
    let OpenDriveMap:    OpenDriveMapInstance | null = null;
    let odrMeshes: OdrMapMeshes = {
      refline_lines: null, road_network_mesh: null, roadmarks_mesh: null,
      lane_outline_lines: null, roadmark_outline_lines: null, ground_grid: null,
    };

    const mouse  = new THREE.Vector2();
    const PARAMS = {
      resolution: 0.3, ref_line: true, roadmarks: true, wireframe: false,
      spotlight: true, lateralProfile: true, laneHeight: true, view_mode: 'Default',
    };

    const syncRefs = () => {
      pointsArrRef.current   = points_arr;
      pointsObjsRef.current  = points_objs;
      cubeCirclesRef.current = cubeCircles;
      roadMeshRef.current    = odrMeshes.road_network_mesh;
    };

    function loadRSU() {
      const r = _loadRSU({
        scene, RSUs: useEditorStore.getState().RSUs,
        points_arr, points_objs,
        isAddPointModeActive: modeRef.current.isAddPointModeActive,
        updateSceneGraph,
      });
      points_arr  = r.points_arr;
      points_objs = r.points_objs;
      modeRef.current.isAddPointModeActive = r.isAddPointModeActive;
      syncRefs();
    }

    function loadPoints() {
      const r = _loadPoints({
        scene,
        cars:   useEditorStore.getState().cars,
        points: useEditorStore.getState().cars.map(car =>
          useEditorStore.getState().points.filter(p => p.carId === car.id)
        ),
        cubeCircles, lines: localLineArr,
      });
      cubeCircles  = r.cubeCircles;
      localLineArr = r.lines;
      syncRefs();
    }

    loadPointsRef.current = loadPoints;

    function loadOdrMap(clear_map = true, fit_view = true) {
      if (!ModuleOpenDrive || !OpenDriveMap) return;

      if (clear_map) {
        clearOdrScene(scene, odrMeshes, picking.scenes, disposable_objs);

        const disposeM = (o: THREE.Mesh) => {
          o.geometry?.dispose();
          (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m?.dispose());
          o.parent?.remove(o);
        };
        carMeshesRef.current.forEach(disposeM);
        points_objs.forEach(disposeM);
        localLineArr.flat().forEach(l => {
          l.parent?.remove(l); l.geometry?.dispose(); (l.material as THREE.Material)?.dispose();
        });
        cubeCircles.flat().forEach(c => {
          c.parent?.remove(c); c.geometry?.dispose(); (c.material as THREE.Material)?.dispose();
        });

        scene.children       = scene.children.filter(c => c.type !== 'Group');
        cubeCircles.length   = 0;
        carMeshesRef.current = [];
        localLineArr = []; points_objs = [];
        currentColorRef.current = '00ff00'; currentCarRef.current = '';
        carQuaternionsRef.current.clear();
        transformControls.detach();
        transformControls.parent?.remove(transformControls);

        const s = useEditorStore.getState();
        s.RSUs.forEach((_, id) => s.removeRSU(id));
        s.points.forEach(p => s.removePoint(p.id));
        s.cars.forEach(c => s.removeCar(c.id.toString()));
        s.selectObject(null);
        syncRefs();
      }

      try {
        odrMeshes = buildOdrScene({
          Module: ModuleOpenDrive, OpenDriveMap, scene, camera, controls,
          light, transformControls, pickingScenes: picking.scenes,
          pickingMaterials: picking.materials, materials: odrMaterials,
          resolution: PARAMS.resolution,
          params: { ref_line: PARAMS.ref_line, roadmarks: PARAMS.roadmarks, view_mode: PARAMS.view_mode },
          disposable_objs, clear_map, fit_view, prevMeshes: odrMeshes, onDone: () => {},
        });
      } catch (err) {
        console.error(err);
        setStep('done');
        setError?.(err instanceof Error ? err : new Error('Не удалось построить сцену карты'));
        return;
      }

      syncRefs();

      startAnimate({
        renderer, scene, camera, controls, mouse,
        spotlightEnabled:  () => PARAMS.spotlight,
        spotlightState, picking,
        getOpenDriveMap:  () => OpenDriveMap,
        getRoadMesh:      () => odrMeshes.road_network_mesh,
        getRoadmarksMesh: () => odrMeshes.roadmarks_mesh,
        spotlightInfo:    document.getElementById('spotlight_info'),
      });

      setStep('done');

      if (!clear_map) {
        setTimeout(() => {
          if (useEditorStore.getState().RSUs.length) loadRSU();
          loadPoints();

          useEditorStore.getState().buildings.forEach(b => {
            if (!buildingModelRef.current) return;
            const already = scene.children.find(c => c.userData.id === b.id);
            if (already) return;
            const m = buildingModelRef.current.clone(true);
            m.userData = { type: 'building', id: b.id };
            m.position.set(b.x, b.y, b.z);
            m.rotation.y = b.rotation ?? 0;
            m.scale.setScalar(b.scale ?? 0.5);
            scene.add(m);
          });

          const rid = useEditorStore.getState().selectedId;
          if (rid) {
            const sm = carMeshesRef.current.find(m => m.userData.id === rid);
            if (sm) transformControls.attach(sm);
          }
          updateSceneGraph();

          setTimeout(() => {
            useEditorStore.getState().lidars.forEach(lidar => {
              const wrapper = carMeshesRef.current.find(m => m.userData.id === lidar.carId) as THREE.Group | undefined;
              if (!wrapper) return;
              if (wrapper.children.find(c => c.userData.id === lidar.id)) return;

              const bodyGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.3, 16);
              const body    = new THREE.Mesh(bodyGeo, new THREE.MeshStandardMaterial({ color: 0x222222 }));
              body.userData = { type: 'lidar', id: lidar.id, carId: lidar.carId };

              const coneGeo = new THREE.ConeGeometry(lidar.range * 0.1, lidar.range * 0.3, 32, 1, true);
              const cone    = new THREE.Mesh(coneGeo, new THREE.MeshBasicMaterial({ color: 0x00ffff, wireframe: true, transparent: true, opacity: 0.15 }));
              cone.rotation.x = Math.PI;
              cone.position.z = lidar.range * 0.15;
              cone.userData   = { type: 'lidar', id: lidar.id, carId: lidar.carId };

              const group = new THREE.Group();
              group.userData = { type: 'lidar', id: lidar.id, carId: lidar.carId };
              group.add(body, cone);
              group.position.set(lidar.x, lidar.y, lidar.z);
              group.rotation.z = lidar.rotation;
              group.scale.setScalar(1 / (wrapper.scale.x || 1));
              wrapper.add(group);
              updateSceneGraph();
            });
          }, 100);
        }, 200);
      }
    }

    function loadFile(file_text: string, clear_map: boolean) {
      if (!ModuleOpenDrive) {
        setStep('done');
        setError?.(new Error('OpenDRIVE module not initialized'));
        return;
      }
      if (clear_map) {
        localStorage.setItem('cached_xodr', file_text);
        const s = useEditorStore.getState();
        s.cars.forEach(c => s.removeCar(c.id));
        s.RSUs.forEach((_, i) => s.removeRSU(i));
        s.points.forEach(p => s.removePoint(p.id));
        s.buildings.forEach(b => s.removeBuilding(b.id));
        setTimeout(() => localStorage.removeItem('editor-scenario-cache'), 100);
        try { ModuleOpenDrive.FS_unlink('./data.xodr'); } catch (_) {}
      }
      try {
        ModuleOpenDrive.FS_createDataFile(".", "data.xodr", file_text, true, true);
        if (OpenDriveMap) OpenDriveMap.delete();
        OpenDriveMap = new ModuleOpenDrive.OpenDriveMap("./data.xodr", {
          with_lateralProfile: PARAMS.lateralProfile, with_laneHeight: PARAMS.laneHeight,
          with_road_objects: false, center_map: true, abs_z_for_for_local_road_obj_outline: true,
        });
        setStep('scene');
        loadOdrMap(clear_map);
      } catch (err) {
        console.error(err);
        setStep('done');
        setError?.(err instanceof Error ? err : new Error('Не удалось обработать файл карты'));
      }
    }

    function reloadOdrMap() {
      if (!ModuleOpenDrive) {
        setStep('done');
        setError?.(new Error('OpenDRIVE module not initialized'));
        return;
      }
      try {
        if (OpenDriveMap) OpenDriveMap.delete();
        OpenDriveMap = new ModuleOpenDrive.OpenDriveMap("./data.xodr", {
          with_lateralProfile: PARAMS.lateralProfile, with_laneHeight: PARAMS.laneHeight,
          with_road_objects: false, center_map: true, abs_z_for_for_local_road_obj_outline: true,
        });
        loadOdrMap(true, false);
      } catch (err) {
        console.error(err);
        setStep('done');
        setError?.(err instanceof Error ? err : new Error('Не удалось перезагрузить карту'));
      }
    }

    transformControls.addEventListener('objectChange' as never, () => {
      try {
        const obj = (transformControls as unknown as { object: THREE.Object3D | undefined }).object;
        if (!obj?.userData) return;
        const { type, id } = obj.userData;

        if (type === 'car' && id) {
          carQuaternionsRef.current.set(id, obj.quaternion.clone());
          updateCar(id, { x: obj.position.x, y: obj.position.y, z: obj.position.z, rotation: obj.rotation.z, scale: obj.scale.x });
        }
        if (type === 'point') {
          const idx = points_arr.indexOf(obj as THREE.Mesh);
          if (idx !== -1) {
            const rsu = useEditorStore.getState().RSUs[idx];
            if (rsu) updateRSU(rsu.id, { x: obj.position.x, y: obj.position.y, z: obj.position.z, protocol: rsu.protocol, script: rsu.script, tx_power: rsu.tx_power, range: rsu.range });
          }
        }
        if (type === 'lidar' && id) {
          useEditorStore.getState().updateLidar(id, { x: obj.position.x, y: obj.position.y, z: obj.position.z, rotation: obj.rotation.z });
        }
        if (type === 'building' && id) {
          useEditorStore.getState().updateBuilding(id, { x: obj.position.x, y: obj.position.y, z: obj.position.z, rotation: obj.rotation.y, scale: obj.scale.x, material: obj.userData.material, height: obj.userData.height });
        }
        if (type === 'circle') {
          const cubeCircles = cubeCirclesRef.current;
          for (let i = 0; i < cubeCircles.length; i++) {
            const ci = cubeCircles[i].indexOf(obj as THREE.Mesh);
            if (ci !== -1) {
              const carId = carMeshesRef.current[i]?.userData.id;
              const pt    = useEditorStore.getState().points.filter(p => p.carId === carId)[ci];
              if (pt) updatePoint(pt.id, { x: obj.position.x, y: obj.position.y, z: obj.position.z });
              setSelectedObject((prev: SelectedObject | null) =>
                prev?.type === 'point'
                  ? { ...prev, position: { x: obj.position.x, y: obj.position.y, z: obj.position.z } }
                  : prev
              );
              break;
            }
          }
        }
      } catch (err) { console.error('objectChange error:', err); }
    });

    const ACTIONS = {
      load_file: () => {
        const input = document.createElement('input');
        input.type = 'file'; input.accept = '.xodr';
        input.addEventListener('change', (ev: Event) => {
          const file = (ev.target as HTMLInputElement).files?.[0]; if (!file) return;
          const reader = new FileReader();
          reader.onload  = e => { if (typeof e.target?.result === 'string') { setStep('map'); loadFile(e.target.result, true); } };
          reader.onerror = () => {
            setStep('done');
            setError?.(new Error('Не удалось прочитать файл'));
          };
          reader.readAsText(file);
        });
        input.click();
      },
      fitView:    () => { if (odrMeshes.refline_lines) fitViewToObj(odrMeshes.refline_lines, camera, controls); },
      reload_map: () => reloadOdrMap(),
      addCube: () => {
        modeRef.current.isAddCarModeActive   = true;
        modeRef.current.isAddPointModeActive = false;
        modeRef.current.isAddedPoints        = false;
        setBuildingMode(false);
        transformControls.detach();
        carMeshesRef.current.forEach(m => updateCar(m.userData.id, { rotation: m.rotation.z }));
        loadPoints();
      },
      addRSU: () => {
        modeRef.current.isAddedPoints        = false;
        modeRef.current.isAddPointModeActive = true;
        modeRef.current.isAddCarModeActive   = false;
        setBuildingMode(false);
      },
      addDirectionPoints: () => {
        if (useEditorStore.getState().selectedId) {
          modeRef.current.isAddedPoints        = true;
          modeRef.current.isAddCarModeActive   = false;
          modeRef.current.isAddPointModeActive = false;
          setBuildingMode(false);
          loadPoints();
        }
      },
      deleteCube: () => {
        const selectedCarId = useEditorStore.getState().selectedId;
        const idx = carMeshesRef.current.findIndex(m => m.userData.id === selectedCarId);
        if (idx < 0) return;
        localLineArr[idx]?.forEach(l => { l.parent?.remove(l); l.geometry?.dispose(); (l.material as THREE.Material)?.dispose(); });
        localLineArr.splice(idx, 1);
        const cubeCircles = cubeCirclesRef.current;
        cubeCircles[idx]?.forEach(c => { c.parent?.remove(c); c.geometry?.dispose(); (c.material as THREE.Material)?.dispose(); });
        cubeCircles.splice(idx, 1);
        if (selectedCarId) removePointsByCarId(selectedCarId);
        const mesh = carMeshesRef.current[idx];
        if (mesh) {
          scene.remove(mesh);
          mesh.traverse(child => {
            const m = child as THREE.Mesh;
            if (m.isMesh) { m.geometry?.dispose(); (Array.isArray(m.material) ? m.material : [m.material]).forEach(mt => mt?.dispose()); }
          });
          carMeshesRef.current.splice(idx, 1);
          deleteCar(mesh.userData.id);
        }
        transformControls.detach(); selectObject(null); loadPoints();
      },
    };

    actionsRef.current.addCube    = ACTIONS.addCube;
    actionsRef.current.addRSU     = ACTIONS.addRSU;
    actionsRef.current.addPoints  = ACTIONS.addDirectionPoints;
    actionsRef.current.deleteCar  = ACTIONS.deleteCube;
    actionsRef.current.deleteCube = ACTIONS.deleteCube;

    window.PARAMS = { ...PARAMS, ...ACTIONS };

    setStep('wasm');
    libOpenDrive()
      .then(Module => {
        ModuleOpenDrive = Module as OpenDriveModule;
        setStep('map');
        const cached = localStorage.getItem('cached_xodr');
        if (cached) { loadFile(cached, false); return; }
        fetch('./data.xodr')
          .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.text(); })
          .then(text => { localStorage.setItem('cached_xodr', text); loadFile(text, false); })
          .catch(err => {
            console.error(err);
            setStep('done');
            setError?.(err instanceof Error ? err : new Error('Не удалось загрузить карту'));
          });
      })
      .catch(err => {
        console.error(err);
        setStep('done');
        setError?.(err instanceof Error ? err : new Error('Ошибка инициализации WebAssembly'));
      });

    return () => { disposeThree(); };
  }, [updateSceneGraph]);

  return { actionsRef };
}