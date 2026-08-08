import { useRef, useCallback } from 'react';
import * as THREE from 'three';
import { OdrMapMeshes } from '../../../../useOpenDriveUtils/useOdrMap/types/useOdrMapTypes';
import { createOdrMaterials } from '../../../../useOpenDriveUtils/useOdrMap';
import { clearScene } from '../utils/clearScene';
import { buildMap } from '../utils/buildMap';
import { restoreLidars } from '../../../../../scene/loaders/restoreLidars';
import {
  EMPTY_ODR_MESHES,
  ODR_PARAMS,
  UseOdrMapManagerProps,
  UseOdrMapManagerResult,
} from '../types/useOdrMapManagerTypes';
import { useEditorRefs } from '../../../../../context';
import { MAP_PATH } from '../../useOdrLoader/types/useOdrLoaderTypes';

export function useOdrMapManager({
  setStep,
  setError,
  loadRSU,
  loadPoints,
  syncRoadMesh,
  updateSceneGraph,
  buildingModelRef,
  buildingMeshesRef,
  localLineArrRef,
  moduleRef,
  mapRef,
  odrMapOptions,
}: UseOdrMapManagerProps): UseOdrMapManagerResult {
  const {
    threeRef,
    carMeshesRef,
    carQuaternionsRef,
    pointsObjsRef,
    cubeCirclesRef,
    currentCarRef,
    currentColorRef,
    odrMapRef,
  } = useEditorRefs();

  const odrMeshesRef = useRef<OdrMapMeshes>({ ...EMPTY_ODR_MESHES });
  const odrMaterials = useRef(createOdrMaterials()).current;
  const disposableObjs = useRef<THREE.BufferGeometry[]>([]);

  const loadOdrMap = useCallback(
    (clearMap = true, fitView = true) => {
      const three = threeRef.current;
      const Module = moduleRef.current;
      const OdrMap = mapRef.current;
      if (!three || !Module || !OdrMap) return;

      if (clearMap) {
        clearScene({
          three,
          odrMeshes: odrMeshesRef.current,
          disposableObjs: disposableObjs.current,
          localLineArrRef,
          carMeshesRef,
          pointsObjsRef,
          cubeCirclesRef,
          carQuaternionsRef,
          currentCarRef,
          currentColorRef,
          syncRoadMesh,
        });
      }

      try {
        buildMap({
          three,
          Module,
          OdrMap,
          odrMaterials,
          disposableObjs: disposableObjs.current,
          odrMeshesRef,
          carMeshesRef,
          clearMap,
          fitView,
          resolution: ODR_PARAMS.resolution,
          params: {
            ref_line: ODR_PARAMS.ref_line,
            roadmarks: ODR_PARAMS.roadmarks,
            view_mode: ODR_PARAMS.view_mode,
          },
          loadRSU,
          loadPoints,
          syncRoadMesh,
          updateSceneGraph,
          buildingModelRef,
          buildingMeshesRef,
        });
      } catch (err) {
        console.error(err);
        setStep('done');
        setError?.(
          err instanceof Error ? err : new Error('Failed to build map scene'),
        );
        return;
      }

      setTimeout(() => restoreLidars({ carMeshesRef, updateSceneGraph }), 100);
      odrMapRef.current = mapRef.current;
      console.log('[OdrMapManager] loadOdrMap finished, calling setStep done');
      console.log('X offset: ', mapRef?.current?.x_offs);
      console.log('Y offset: ', mapRef?.current?.y_offs);
      try {
        three.renderer.compile(three.scene, three.camera);
      } catch (err) {
        console.error('renderer.compile failed:', err);
      }

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setStep('done');
        });
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      loadRSU,
      loadPoints,
      syncRoadMesh,
      updateSceneGraph,
      buildingModelRef,
      buildingMeshesRef,
      carMeshesRef,
      pointsObjsRef,
      cubeCirclesRef,
      carQuaternionsRef,
      currentCarRef,
      currentColorRef,
      localLineArrRef,
      setStep,
      setError,
      moduleRef,
      mapRef,
    ],
  );

  const reloadOdrMap = useCallback(() => {
    const Module = moduleRef.current;
    if (!Module) {
      setStep('done');
      setError?.(new Error('OpenDRIVE module not initialized'));
      return;
    }
    try {
      mapRef.current?.delete();
      mapRef.current = new Module.OpenDriveMap(MAP_PATH, odrMapOptions);
      odrMapRef.current = mapRef.current;
      loadOdrMap(true, false);
      console.log('X offset: ', mapRef.current.x_offs);
      console.log('Y offset: ', mapRef.current.y_offs);
    } catch (err) {
      console.error(err);
      setStep('done');
      setError?.(
        err instanceof Error ? err : new Error('Failed to reload the map'),
      );
    }
  }, [
    loadOdrMap,
    setStep,
    setError,
    moduleRef,
    mapRef,
    odrMapRef,
    odrMapOptions,
  ]);

  return {
    getOdrMeshes: useCallback(() => odrMeshesRef.current, []),
    loadOdrMap,
    reloadOdrMap,
  };
}
