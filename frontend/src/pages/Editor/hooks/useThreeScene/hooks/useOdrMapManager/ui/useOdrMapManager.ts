import { useRef, useCallback } from 'react';
import * as THREE from 'three';
import { OpenDriveMapInstance } from '../../../../../types/editorTypes';
import {
  OdrMapMeshes,
  OpenDriveModule,
} from '../../../../useOpenDriveUtils/useOdrMap/types/useOdrMapTypes';
import { createOdrMaterials } from '../../../../useOpenDriveUtils/useOdrMap';
import { clearScene } from '../utils/clearScene';
import { buildMap } from '../utils/buildMap';
import { restoreLidars } from '../../../../../scene/loaders/restoreLidars';
import {
  EMPTY_ODR_MESHES,
  ODR_MAP_OPTIONS,
  ODR_PARAMS,
  UseOdrMapManagerProps,
  UseOdrMapManagerResult,
} from '../types/useOdrMapManagerTypes';
import { useEditorRefs } from '../../../../../context';

export function useOdrMapManager({
  setStep,
  setError,
  loadRSU,
  loadPoints,
  syncRoadMesh,
  updateSceneGraph,
  buildingModelRef,
  localLineArrRef,
}: UseOdrMapManagerProps): UseOdrMapManagerResult {
  const {
    threeRef,
    carMeshesRef,
    carQuaternionsRef,
    pointsObjsRef,
    cubeCirclesRef,
    currentCarRef,
    currentColorRef,
  } = useEditorRefs();

  const odrMeshesRef = useRef<OdrMapMeshes>({ ...EMPTY_ODR_MESHES });
  const odrMaterials = useRef(createOdrMaterials()).current;
  const disposableObjs = useRef<THREE.BufferGeometry[]>([]);
  const moduleRef = useRef<OpenDriveModule | null>(null);
  const mapRef = useRef<OpenDriveMapInstance | null>(null);

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
      setStep('done');
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      loadRSU,
      loadPoints,
      syncRoadMesh,
      updateSceneGraph,
      buildingModelRef,
      carMeshesRef,
      pointsObjsRef,
      cubeCirclesRef,
      carQuaternionsRef,
      currentCarRef,
      currentColorRef,
      localLineArrRef,
      setStep,
      setError,
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
      mapRef.current = new Module.OpenDriveMap('./data.xodr', ODR_MAP_OPTIONS);
      loadOdrMap(true, false);
    } catch (err) {
      console.error(err);
      setStep('done');
      setError?.(
        err instanceof Error ? err : new Error('Failed to reload the map'),
      );
    }
  }, [loadOdrMap, setStep, setError]);

  return {
    getOdrMeshes: useCallback(() => odrMeshesRef.current, []),
    loadOdrMap,
    reloadOdrMap,
    setModuleRef: moduleRef,
    setMapRef: mapRef,
  };
}
