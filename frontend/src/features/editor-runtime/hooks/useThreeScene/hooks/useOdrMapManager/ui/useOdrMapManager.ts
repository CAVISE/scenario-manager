import { useRef, useCallback, useEffect } from 'react';
import * as THREE from 'three';

import { clearScene } from '../utils/clearScene';
import { buildMap } from '../utils/buildMap';
import { restoreLidars } from '@editor/scene/loaders/restoreLidars';
import {
  UseOdrMapManagerProps,
  UseOdrMapManagerResult,
  PreparedOdrGeometryCache,
} from '../types/useOdrMapManagerTypes';
import {
  EMPTY_ODR_MESHES,
  ODR_PARAMS,
} from '../constants/useOdrMapManagerConstants';
import { useEditorRefs } from '@editor/context';
import {
  MAP_PATH,
  ODR_MAP_OPTIONS,
} from '../../../constants/openDriveConstants';
import {
  OdrMapMeshes,
  OpenDriveModule,
} from '@editor/hooks/useOpenDriveUtils/useOdrMap/types/useOdrMapTypes';
import { OpenDriveMapInstance } from '@editor/types/editorTypes';
import {
  createOdrMaterials,
  disposeOdrMaterials,
} from '@editor/hooks/useOpenDriveUtils/useOdrMap';
import {
  getCachedXodrContent,
  isLargeXodrSelected,
} from '../../useOdrLoader/utils/xodrRepository';
import { prepareOdrGeometryInWorker } from '../utils/prepareOdrGeometryInWorker';
import type { PreparedOdrGeometry } from '@editor/types/odrGeometryTypes';

// The full-resolution mesh of this OSM export is too large to build on the
// browser main thread. Keep the normal resolution for every other map.
const LARGE_XODR_RESOLUTION = 2;

export function useOdrMapManager({
  setStep,
  setError,
  syncRoutePointMeshes,
  syncRoadMesh,
  updateSceneGraph,
  buildingMeshesRef,
  localLineArrRef,
}: UseOdrMapManagerProps): UseOdrMapManagerResult {
  const {
    threeRef,
    carMeshesRef,
    carQuaternionsRef,
    rsuObjectMeshesRef,
    routePointMeshesRef,
    currentCarRef,
    currentColorRef,
    odrMapRef,
  } = useEditorRefs();

  const odrMeshesRef = useRef<OdrMapMeshes>({ ...EMPTY_ODR_MESHES });
  const odrMaterials = useRef(createOdrMaterials()).current;
  const disposableGeometriesRef = useRef<THREE.BufferGeometry[]>([]);
  const moduleRef = useRef<OpenDriveModule | null>(null);
  const mapRef = useRef<OpenDriveMapInstance | null>(null);
  const mapBuildRequestRef = useRef(0);
  const preparedGeometryCacheRef = useRef<PreparedOdrGeometryCache | null>(
    null
  );
  const geometryPreparationAbortRef = useRef<AbortController | null>(null);
  const lidarRestoreTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  useEffect(() => {
    return () => {
      mapBuildRequestRef.current += 1;
      geometryPreparationAbortRef.current?.abort();
      if (lidarRestoreTimerRef.current)
        clearTimeout(lidarRestoreTimerRef.current);
      disposeOdrMaterials(odrMaterials);
    };
  }, [odrMaterials]);

  const loadOdrMap = useCallback(
    (
      clearMap = true,
      fitView = true,
      onComplete?: (success: boolean) => void,
      xodrText?: string
    ) => {
      const three = threeRef.current;
      const Module = moduleRef.current;
      const OdrMap = mapRef.current;
      if (!three || !Module || !OdrMap) {
        onComplete?.(false);
        return;
      }

      const isLargeMap = isLargeXodrSelected();
      const resolution = isLargeMap
        ? LARGE_XODR_RESOLUTION
        : ODR_PARAMS.resolution;
      const requestId = ++mapBuildRequestRef.current;
      geometryPreparationAbortRef.current?.abort();
      geometryPreparationAbortRef.current = null;
      const buildScene = (preparedGeometry?: PreparedOdrGeometry) => {
        if (requestId !== mapBuildRequestRef.current) {
          onComplete?.(false);
          return;
        }

        try {
          if (clearMap) {
            clearScene({
              three,
              odrMeshes: odrMeshesRef.current,
              disposableGeometries: disposableGeometriesRef.current,
              localLineArrRef,
              carMeshesRef,
              rsuObjectMeshesRef,
              routePointMeshesRef,
              carQuaternionsRef,
              currentCarRef,
              currentColorRef,
              syncRoadMesh,
            });
          }
          buildMap({
            three,
            Module,
            OdrMap,
            odrMaterials,
            disposableGeometries: disposableGeometriesRef.current,
            odrMeshesRef,
            carMeshesRef,
            clearMap,
            fitView,
            resolution,
            params: {
              ref_line: ODR_PARAMS.ref_line,
              roadmarks: ODR_PARAMS.roadmarks,
              view_mode: ODR_PARAMS.view_mode,
            },
            syncRoutePointMeshes,
            syncRoadMesh,
            updateSceneGraph,
            buildingMeshesRef,
            preparedGeometry,
          });
        } catch (err) {
          console.error(err);
          setStep('done');
          setError?.(
            err instanceof Error ? err : new Error('Failed to build map scene')
          );
          onComplete?.(false);
          return;
        }

        if (lidarRestoreTimerRef.current)
          clearTimeout(lidarRestoreTimerRef.current);
        lidarRestoreTimerRef.current = setTimeout(() => {
          lidarRestoreTimerRef.current = null;
          if (requestId !== mapBuildRequestRef.current) return;
          restoreLidars({ carMeshesRef, updateSceneGraph });
        }, 100);
        odrMapRef.current = mapRef.current;
        try {
          three.renderer.compile(three.scene, three.camera);
        } catch (err) {
          console.error('renderer.compile failed:', err);
        }

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (requestId !== mapBuildRequestRef.current) {
              onComplete?.(false);
              return;
            }
            setStep('done');
            onComplete?.(true);
          });
        });
      };

      const xodr = xodrText ?? getCachedXodrContent();
      if (isLargeMap && xodr) {
        const cachedGeometry = preparedGeometryCacheRef.current;
        if (
          cachedGeometry?.xodr === xodr &&
          cachedGeometry.resolution === resolution
        ) {
          buildScene(cachedGeometry.geometry);
          return;
        }

        const abortController = new AbortController();
        geometryPreparationAbortRef.current = abortController;
        void prepareOdrGeometryInWorker(
          { xodr, resolution },
          abortController.signal
        )
          .then((geometry) => {
            if (requestId !== mapBuildRequestRef.current) {
              onComplete?.(false);
              return;
            }
            preparedGeometryCacheRef.current = { xodr, resolution, geometry };
            buildScene(geometry);
          })
          .catch((err) => {
            if (abortController.signal.aborted) {
              onComplete?.(false);
              return;
            }
            console.warn(
              '[OdrMapManager] worker preparation failed; using main-thread fallback',
              err
            );
            buildScene();
          })
          .finally(() => {
            if (geometryPreparationAbortRef.current === abortController) {
              geometryPreparationAbortRef.current = null;
            }
          });
        return;
      }

      buildScene();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      syncRoutePointMeshes,
      syncRoadMesh,
      updateSceneGraph,
      buildingMeshesRef,
      carMeshesRef,
      rsuObjectMeshesRef,
      routePointMeshesRef,
      carQuaternionsRef,
      currentCarRef,
      currentColorRef,
      localLineArrRef,
      setStep,
      setError,
    ]
  );

  const cancelMapBuild = useCallback(() => {
    mapBuildRequestRef.current += 1;
    geometryPreparationAbortRef.current?.abort();
    geometryPreparationAbortRef.current = null;
    if (lidarRestoreTimerRef.current) {
      clearTimeout(lidarRestoreTimerRef.current);
      lidarRestoreTimerRef.current = null;
    }
  }, []);

  const reloadOdrMap = useCallback(() => {
    const Module = moduleRef.current;
    if (!Module) {
      setStep('done');
      setError?.(new Error('OpenDRIVE module not initialized'));
      return;
    }
    try {
      odrMapRef.current = null;
      mapRef.current?.delete();
      mapRef.current = new Module.OpenDriveMap(MAP_PATH, ODR_MAP_OPTIONS);
      odrMapRef.current = mapRef.current;
      loadOdrMap(true, false);
    } catch (err) {
      console.error(err);
      setStep('done');
      setError?.(
        err instanceof Error ? err : new Error('Failed to reload the map')
      );
    }
  }, [loadOdrMap, setStep, setError, moduleRef, mapRef, odrMapRef]);

  return {
    getOdrMeshes: useCallback(() => odrMeshesRef.current, []),
    loadOdrMap,
    cancelMapBuild,
    reloadOdrMap,
    setModuleRef: moduleRef,
    setMapRef: mapRef,
  };
}
