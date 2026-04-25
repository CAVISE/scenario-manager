import { useRef, useEffect, useState } from 'react';

import { useEditorStore } from '../../../../../store';

import { useTransformSetup } from '../hooks/useTransformSetup';
import { useSceneObjects } from '../hooks/useSceneObjects';
import { useSceneAnimator } from '../hooks/useSceneAnimator';

import type {
  useThreeSceneProps,
  UseThreeSceneResult,
} from '../types/useThreeSceneTypes';
import { useOdrLoader } from '../hooks/useOdrLoader';
import { useOdrMapManager } from '../hooks/useOdrMapManager';
import { useEditorRefs } from '../../../context';
import { createStoreSubscriptions } from '../../createEvents/createStoreSubscriptions';
import { createEditorActions } from '../../createEvents/createEditorActions';
import { createTransformListener } from '../../createEvents/createTransformListener';
import { createThreeSetup } from '../../useOpenDriveUtils/useThreeSetup';

export function useThreeScene({
  updateSceneGraph,
  setStep,
  buildingModelRef,
}: useThreeSceneProps): UseThreeSceneResult {
  const setError = useEditorStore((s) => s.setError);

  const {
    threeRef,
    sceneRef,
    cameraRef,
    transformControlsRef,
    carMeshesRef,
    carQuaternionsRef,
    cubeCirclesRef,
    modeRef,
    currentCarRef,
    currentColorRef,
    isDraggingRef,
  } = useEditorRefs();

  const actionsRef = useRef({
    addCube: () => {},
    addRSU: () => {},
    addPoints: () => {},
    deleteCar: () => {},
    deleteCube: () => {},
    addPedestrian: () => {},
  });

  const [threeReady, setThreeReady] = useState(false);
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    let result: ReturnType<typeof createThreeSetup>;
    try {
      result = createThreeSetup('ThreeJS', () => {});
    } catch (err) {
      setStep('done');
      setError?.(
        err instanceof Error ? err : new Error('WebGL initialization failed'),
      );
      return;
    }

    threeRef.current = result.setup;
    sceneRef.current = result.setup.scene;
    cameraRef.current = result.setup.camera;
    transformControlsRef.current = result.setup.transformControls;

    updateSceneGraph();
    setThreeReady(true);

    return () => {
      result.dispose();
      threeRef.current = null;
      sceneRef.current = undefined;
      cameraRef.current = undefined;
      transformControlsRef.current = undefined;
      setThreeReady(false);
    };
  }, []);

  const { getIsDragging } = useTransformSetup({
    transformControls: threeRef.current?.transformControls,
    isDraggingRef,
  });

  const { loadRSU, loadPoints, syncRoadMesh, localLineArrRef } =
    useSceneObjects({
      updateSceneGraph,
      buildingModelRef,
    });

  const { getOdrMeshes, loadOdrMap, reloadOdrMap, setModuleRef, setMapRef } =
    useOdrMapManager({
      setStep,
      setError,
      loadRSU,
      loadPoints,
      syncRoadMesh,
      updateSceneGraph,
      buildingModelRef,
      localLineArrRef,
    });
  const loadOdrMapRef = useRef(loadOdrMap);
  useEffect(() => {
    loadOdrMapRef.current = loadOdrMap;
  }, [loadOdrMap]);
  useOdrLoader({
    setStep,
    setError,
    moduleRef: setModuleRef,
    mapRef: setMapRef,
    loadOdrMapRef,
  });

  useSceneAnimator({
    getIsDragging,
    getOdrMeshes,
    getOpenDriveMap: () => setMapRef.current,
    spotlightEnabled: () => true,
  });
  useEffect(() => {
    setThreeReady(true);
  }, []);
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    if (!threeReady) return;
    return createStoreSubscriptions({
      sceneRef,
      buildingModelRef,
      getIsDragging,
      loadRSU,
      loadPoints,
      updateSceneGraph,
    });
  }, [
    threeReady,
    loadRSU,
    loadPoints,
    getIsDragging,
    updateSceneGraph,
    sceneRef,
    buildingModelRef,
  ]);

  useEffect(() => {
    if (!threeReady || !threeRef.current) return;
    return createTransformListener({
      transformControls: threeRef.current.transformControls,
      carMeshesRef,
      cubeCirclesRef,
      carQuaternionsRef,
    });
  }, [threeReady, carMeshesRef, cubeCirclesRef, carQuaternionsRef]);

  useEffect(() => {
    if (!threeReady || !threeRef.current) return;
    const { camera, controls, transformControls } = threeRef.current;

    const ACTIONS = createEditorActions({
      modeRef,
      carMeshesRef,
      cubeCirclesRef,
      currentCarRef,
      currentColorRef,
      transformControls,
      localLineArrRef,
      camera,
      controls,
      getOdrMeshes,
      loadPoints,
      loadFile: () => {},
      reloadOdrMap,
    });

    actionsRef.current.addCube = ACTIONS.addCube;
    actionsRef.current.addRSU = ACTIONS.addRSU;
    actionsRef.current.addPoints = ACTIONS.addDirectionPoints;
    actionsRef.current.deleteCar = ACTIONS.deleteCube;
    actionsRef.current.deleteCube = ACTIONS.deleteCube;
    actionsRef.current.addPedestrian = ACTIONS.addPedestrian;

    if (process.env.NODE_ENV === 'development') {
      (window as unknown as Record<string, unknown>).PARAMS = ACTIONS;
    }
  }, [
    threeReady,
    modeRef,
    carMeshesRef,
    cubeCirclesRef,
    currentCarRef,
    currentColorRef,
    localLineArrRef,
    getOdrMeshes,
    loadPoints,
    reloadOdrMap,
  ]);

  return { actionsRef };
}
