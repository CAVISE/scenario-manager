import { useEffect, useRef } from 'react';
import * as THREE from 'three';

import { loadRSU    as _loadRSU    } from '../scene/loadRSU';
import { loadPoints as _loadPoints } from '../scene/loadPoints';
import { useEditorStore }            from '../../../store/useEditorStore';

import { createThreeSetup }                                 from './useThreeSetup';
import { createOdrMaterials, clearOdrScene, buildOdrScene } from './useOdrMap';
import { startAnimate, createSpotlightState }               from './useSpotlight';

import { createTransformListener }  from './createTransformListener';
import { createEditorActions }      from './createEditorActions';
import { createStoreSubscriptions } from './createStoreSubscriptions';
import { restoreObjects }           from '../scene/restoreObjects';
import { restoreLidars }            from '../scene/restoreLidars';

import type { OdrMapMeshes, OpenDriveModule }        from './types/useOdrMapTypes';
import type { OpenDriveMapInstance } from '../types/editorTypes';
import { libOpenDrive }                              from '../types/editorTypes';
import type { UseThreeSceneOptions, UseThreeSceneResult } from './types/useThreeSceneTypes';
import { useEditorRefs } from '../context/EditorRefsContext';


export function useThreeScene(opts: UseThreeSceneOptions): UseThreeSceneResult {
  const {
    buildingModelRef,
    setStep, updateSceneGraph
  } = opts;
  const setError = useEditorStore(s=>s.setError)
  const { sceneRef, cameraRef, transformControlsRef,
    carMeshesRef, carQuaternionsRef,
    pointsArrRef, pointsObjsRef, cubeCirclesRef, roadMeshRef,
    currentCarRef, currentColorRef, loadPointsRef, loadRSURef,
    modeRef, pedestrianMeshesRef, isDraggingRef} = useEditorRefs()
  const actionsRef = useRef({
    addCube:       () => {},
    addRSU:        () => {},
    addPoints:     () => {},
    deleteCar:     () => {},
    deleteCube:    () => {},
    addPedestrian: () => {},
  });
  const localLineArrRef = useRef<THREE.Line[][]>([]);
  
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

    let isDragging = false;
    transformControls.addEventListener('mouseDown' as never, () => {
      isDragging = true;
      if (isDraggingRef) isDraggingRef.current = true;
    });
    transformControls.addEventListener('mouseUp' as never, () => {
      isDragging = false;
      if (isDraggingRef) isDraggingRef.current = false;
    });

    const odrMaterials    = createOdrMaterials();
    const disposable_objs: THREE.BufferGeometry[] = [];

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
      pointsArrRef.current   = pointsArrRef.current;
      pointsObjsRef.current  = pointsObjsRef.current;
      cubeCirclesRef.current = cubeCirclesRef.current;
      roadMeshRef.current    = odrMeshes.road_network_mesh;
    };

    function loadRSU() {
      pointsObjsRef.current.forEach(obj => {
        if (obj.userData.type === 'point') {
          obj.parent?.remove(obj);
          obj.geometry?.dispose();
          const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
          materials.forEach(m => m?.dispose());
        }
      });
      pointsObjsRef.current.length = 0;
      pointsArrRef.current.length  = 0;
      const r = _loadRSU({
        scene,
        RSUs: useEditorStore.getState().RSUs,
        points_arr: pointsArrRef.current, points_objs: pointsObjsRef.current,
        isAddPointModeActive: modeRef.current.isAddPointModeActive,
        updateSceneGraph,
      });
      pointsArrRef.current.push(...r.points_arr);
      pointsObjsRef.current.push(...r.points_objs);
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
        cubeCircles: cubeCirclesRef.current, lines: localLineArrRef.current,
      });
      cubeCirclesRef.current = r.cubeCircles;
      localLineArrRef.current = r.lines;
      syncRefs();
    }

    loadPointsRef.current = loadPoints;
    loadRSURef.current    = loadRSU;

    const unsubStore = createStoreSubscriptions({
      sceneRef, buildingModelRef,
      getIsDragging: () => isDragging,
      loadRSU, loadPoints, updateSceneGraph,
    });

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
        pointsObjsRef.current.forEach(disposeM);
        localLineArrRef.current.flat().forEach(l => {
          l.parent?.remove(l); l.geometry?.dispose(); (l.material as THREE.Material)?.dispose();
        });
        cubeCirclesRef.current.flat().forEach(c => {
          c.parent?.remove(c); c.geometry?.dispose(); (c.material as THREE.Material)?.dispose();
        });

        scene.children          = scene.children.filter(c => c.type !== 'Group');
        cubeCirclesRef.current.length      = 0;
        carMeshesRef.current    = [];
        localLineArrRef.current = [];
        pointsObjsRef.current   = [];
        currentColorRef.current = '00ff00';
        currentCarRef.current   = '';
        carQuaternionsRef.current.clear();
        transformControls.detach();
        transformControls.parent?.remove(transformControls);

        const s = useEditorStore.getState();
        while (useEditorStore.getState().RSUs.length > 0) useEditorStore.getState().removeRSU(0);
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
        setError?.(err instanceof Error ? err : new Error('Failed to build map scene'));
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
        onBeforeRender: () => {
          if (isDragging) return;
          useEditorStore.getState().cars.forEach((car, i) => {
            const mesh = carMeshesRef.current.find(m => m.userData.id === car.id);
            if (!mesh) return;
            mesh.position.set(car.x, car.y, car.z);
            mesh.scale.setScalar(car.scale ?? 1);
            mesh.rotation.z = car.rotation ?? 0;
            const circles = cubeCirclesRef.current[i];
            if (circles) {
              useEditorStore.getState().points
                .filter(p => p.carId === car.id)
                .forEach((pt, j) => { if (circles[j]) circles[j].position.set(pt.x, pt.y, pt.z); });
            }
          });
          useEditorStore.getState().RSUs.forEach(rsu => {
            const mesh = pointsObjsRef.current.find(m => m.userData.id === rsu.id);
            if (!mesh) return;
            mesh.position.set(rsu.x, rsu.y, rsu.z);
          });
          useEditorStore.getState().buildings.forEach(building => {
            const mesh = scene.children.find(c => c.userData.id === building.id);
            if (!mesh) return;
            mesh.position.set(building.x, building.y, building.z);
            mesh.rotation.y = building.rotation ?? 0;
            mesh.scale.setScalar(building.scale ?? 0.5);
          });
          useEditorStore.getState().pedestrians.forEach(pedestrian => {
            const mesh = pedestrianMeshesRef.current.find(p => p.userData.id === pedestrian.id);
            if (!mesh) return;
            mesh.position.set(pedestrian.x, pedestrian.y, pedestrian.z ?? 0);
          });
        },
      });

      setStep('done');

      setTimeout(() => {
        restoreObjects({ scene, buildingModelRef, loadRSU, updateSceneGraph });
        loadPoints();
        const rid = useEditorStore.getState().selectedId;
        if (rid) {
          const sm = carMeshesRef.current.find(m => m.userData.id === rid);
          if (sm) transformControls.attach(sm);
        }
        updateSceneGraph();
        setTimeout(() => restoreLidars({ carMeshesRef, updateSceneGraph }), 100);
      }, 200);
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
        while (useEditorStore.getState().RSUs.length > 0) useEditorStore.getState().removeRSU(0);
        s.points.forEach(p => s.removePoint(p.id));
        s.buildings.forEach(b => s.removeBuilding(b.id));
        setTimeout(() => localStorage.removeItem('editor-scenario-cache'), 100);
        try { ModuleOpenDrive.FS_unlink('./data.xodr'); } catch (err) {
          console.error(err);
          setStep('done');
          setError?.(err instanceof Error ? err : new Error('Failed to process map file'));
        }
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
        setError?.(err instanceof Error ? err : new Error('Failed to process map file'));
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
        setError?.(err instanceof Error ? err : new Error('Failed to reload the map'));
      }
    }

    const disposeTransformListener = createTransformListener({
      transformControls,
      carMeshesRef, cubeCirclesRef, carQuaternionsRef,
    });

    const ACTIONS = createEditorActions({
      modeRef, carMeshesRef, cubeCirclesRef,
      currentCarRef, currentColorRef,
      transformControls, localLineArrRef,
      camera, controls,
      getOdrMeshes: () => odrMeshes,
      loadPoints, loadFile, reloadOdrMap,
    });

    actionsRef.current.addCube       = ACTIONS.addCube;
    actionsRef.current.addRSU        = ACTIONS.addRSU;
    actionsRef.current.addPoints     = ACTIONS.addDirectionPoints;
    actionsRef.current.deleteCar     = ACTIONS.deleteCube;
    actionsRef.current.deleteCube    = ACTIONS.deleteCube;
    actionsRef.current.addPedestrian = ACTIONS.addPedestrian;
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
            setError?.(err instanceof Error ? err : new Error('Failed to load map'));
          });
      })
      .catch(err => {
        console.error(err);
        setStep('done');
        setError?.(err instanceof Error ? err : new Error('WebAssembly initialization error'));
      });

    return () => {
      disposeTransformListener();
      disposeThree();
      unsubStore();
    };
  }, [updateSceneGraph]);

  return { actionsRef };
}