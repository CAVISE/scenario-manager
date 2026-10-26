import { useRef, useEffect, useState } from 'react';

import { useEditorStore } from '@/store';

import { useTransformSetup } from '../hooks/useTransformSetup';
import { useSceneObjects } from '../hooks/useSceneObjects';
import { useSceneAnimator } from '../hooks/useSceneAnimator';
import { useEditorVisualPreferences } from '../hooks/useEditorVisualPreferences';

import type {
  useThreeSceneProps,
  UseThreeSceneResult,
} from '../types/useThreeSceneTypes';
import { useOdrLoader } from '../hooks/useOdrLoader';
import { useOdrMapManager } from '../hooks/useOdrMapManager';
import { createStoreSubscriptions } from '../../createEvents/createStoreSubscriptions';
import { createEditorActions } from '../../createEvents/createEditorActions';
import { createTransformListener } from '../../createEvents/createTransformListener';
import { createHistoryTracker } from '../../createEvents/createHistoryTracker';
import { createThreeSetup } from '../../useOpenDriveUtils/useThreeSetup';
import { useEditorRefs } from '@editor/context';
import { isLargeXodrSelected } from '../hooks/useOdrLoader/utils/xodrRepository';

export function useThreeScene({
  updateSceneGraph,
  setStep,
}: useThreeSceneProps): UseThreeSceneResult {
  const setError = useEditorStore((s) => s.setError);

  const {
    threeRef,
    sceneRef,
    cameraRef,
    transformControlsRef,
    carMeshesRef,
    carQuaternionsRef,
    routePointMeshesRef,
    roadMeshRef,
    modeRef,
    currentCarRef,
    currentColorRef,
    isDraggingRef,
    buildingMeshesRef,
    odrMapRef,
  } = useEditorRefs();

  const actionsRef = useRef({
    addCar: () => {},
    addRSU: () => {},
    startRoutePointPlacement: () => {},
    deleteCar: () => {},
    addPedestrian: () => {},
  });

  const [threeReady, setThreeReady] = useState(false);
  const initializationCallbacksRef = useRef({
    setStep,
    setError,
    updateSceneGraph,
  });
  initializationCallbacksRef.current = { setStep, setError, updateSceneGraph };

  useEffect(() => {
    const callbacks = initializationCallbacksRef.current;
    let result: ReturnType<typeof createThreeSetup>;
    try {
      result = createThreeSetup('ThreeJS', () => {});
    } catch (err) {
      callbacks.setStep('done');
      callbacks.setError?.(
        err instanceof Error ? err : new Error('WebGL initialization failed')
      );
      return;
    }

    threeRef.current = result.setup;
    sceneRef.current = result.setup.scene;
    cameraRef.current = result.setup.camera;
    transformControlsRef.current = result.setup.transformControls;

    callbacks.updateSceneGraph();
    setThreeReady(true);

    return () => {
      result.dispose();
      threeRef.current = null;
      sceneRef.current = undefined;
      cameraRef.current = undefined;
      transformControlsRef.current = null;
      setThreeReady(false);
    };
  }, [threeRef, sceneRef, cameraRef, transformControlsRef]);

  const { getIsDragging } = useTransformSetup({
    transformControls: threeRef.current?.transformControls,
    isDraggingRef,
  });

  const { syncRoutePointMeshes, syncRoadMesh, localLineArrRef } =
    useSceneObjects();

  const {
    getOdrMeshes,
    loadOdrMap,
    cancelMapBuild,
    reloadOdrMap,
    setModuleRef,
    setMapRef,
  } = useOdrMapManager({
    setStep,
    setError,
    syncRoutePointMeshes,
    syncRoadMesh,
    updateSceneGraph,
    buildingMeshesRef,
    localLineArrRef,
  });
  const loadOdrMapRef = useRef(loadOdrMap);
  useEffect(() => {
    loadOdrMapRef.current = loadOdrMap;
  }, [loadOdrMap]);
  const { loadFile } = useOdrLoader({
    setStep,
    setError,
    moduleRef: setModuleRef,
    mapRef: setMapRef,
    odrMapRef,
    loadOdrMapRef,
  });

  useSceneAnimator({
    getOdrMeshes,
    getOpenDriveMap: () => setMapRef.current,
    // The picking pass renders the full road geometry three more times after
    // every mouse move. It makes the large OSM map unresponsive, while the
    // normal map rendering and editor controls remain available.
    spotlightEnabled: () => !isLargeXodrSelected(),
  });
  useEditorVisualPreferences({
    ready: threeReady,
    sceneRef,
    getOdrMeshes,
  });
  useEffect(() => {
    if (!threeReady) return;
    return createStoreSubscriptions({
      getIsDragging,
      syncRoutePointMeshes,
      updateSceneGraph,
    });
  }, [threeReady, syncRoutePointMeshes, getIsDragging, updateSceneGraph]);

  useEffect(() => {
    if (!threeReady || !threeRef.current) return;
    return createTransformListener({
      transformControls: threeRef.current.transformControls,
      sceneRef,
      carMeshesRef,
      routePointMeshesRef,
      localLineArrRef,
      roadMeshRef,
      carQuaternionsRef,
    });
  }, [
    threeReady,
    threeRef,
    sceneRef,
    carMeshesRef,
    routePointMeshesRef,
    localLineArrRef,
    roadMeshRef,
    carQuaternionsRef,
  ]);

  useEffect(() => {
    if (!threeReady) return;
    return createHistoryTracker({ getIsDragging });
  }, [threeReady, getIsDragging]);

  useEffect(() => {
    if (!threeReady || !threeRef.current) return;
    const { camera, controls, transformControls } = threeRef.current;

    const ACTIONS = createEditorActions({
      modeRef,
      carMeshesRef,
      routePointMeshesRef,
      currentCarRef,
      currentColorRef,
      transformControls,
      localLineArrRef,
      camera,
      controls,
      getOdrMeshes,
      syncRoutePointMeshes,
      loadFile: async () => false,
      reloadOdrMap,
    });

    actionsRef.current.addCar = ACTIONS.addCar;
    actionsRef.current.addRSU = ACTIONS.addRSU;
    actionsRef.current.startRoutePointPlacement =
      ACTIONS.startRoutePointPlacement;
    actionsRef.current.deleteCar = ACTIONS.deleteCar;
    actionsRef.current.addPedestrian = ACTIONS.addPedestrian;
  }, [
    threeReady,
    threeRef,
    modeRef,
    carMeshesRef,
    routePointMeshesRef,
    currentCarRef,
    currentColorRef,
    localLineArrRef,
    getOdrMeshes,
    syncRoutePointMeshes,
    reloadOdrMap,
  ]);

  return { actionsRef, loadFile, cancelMapLoad: cancelMapBuild };
}
