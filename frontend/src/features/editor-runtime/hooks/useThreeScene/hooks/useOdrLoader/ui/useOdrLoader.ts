import { OpenDriveModule } from '@editor/hooks/useOpenDriveUtils/useOdrMap/types/useOdrMapTypes';
import { libOpenDrive } from '@editor/utils/libOpenDrive';
import { useEditorStore } from '@/store';
import { useEffect, useRef } from 'react';
import { beginMapLoadRequest } from '@editor/lib/mapLoadRequest';
import { UseOdrLoaderProps } from '../types/useOdrLoaderTypes';
import {
  MAP_PATH,
  ODR_MAP_OPTIONS,
} from '../../../constants/openDriveConstants';
import {
  setCachedCustomXodrContent,
  DEFAULT_XODR,
  getCachedXodrContent,
  getStoredXodrName,
  normalizeMapName,
  fetchXodrText,
  initXodrCacheFromIndexedDb,
  setStoredXodrName,
  clearStoredXodrName,
} from '../utils/xodrRepository';

export function useOdrLoader({
  setStep,
  setError,
  moduleRef,
  mapRef,
  odrMapRef,
  loadOdrMapRef,
}: UseOdrLoaderProps) {
  const callbacksRef = useRef({ setStep, setError });
  callbacksRef.current = { setStep, setError };
  useEffect(() => {
    let cancelled = false;
    const isInitialMapLoadCurrent = beginMapLoadRequest();
    function processFile(fileText: string, clearMap: boolean) {
      const Module = moduleRef.current;
      if (!Module || cancelled || !isInitialMapLoadCurrent()) return;
      setCachedCustomXodrContent(fileText);
      if (clearMap) {
        const s = useEditorStore.getState();
        s.cars.forEach((c) => s.removeCar(c.id));
        s.removeAllRSUs();
        s.points.forEach((p) => s.removePoint(p.id));
        s.buildings.forEach((b) => s.removeBuilding(b.id));
        s.pedestrians.forEach((p) => s.removePedestrian(p.id));
      }
      try {
        Module.FS_unlink(MAP_PATH);
      } catch {
        //
      }
      try {
        Module.FS_createDataFile('.', DEFAULT_XODR, fileText, true, true);
        odrMapRef.current = null;
        mapRef.current?.delete();
        mapRef.current = new Module.OpenDriveMap(MAP_PATH, ODR_MAP_OPTIONS);
        callbacksRef.current.setStep('scene');
        loadOdrMapRef.current(clearMap);
      } catch (err) {
        console.error(err);
        callbacksRef.current.setStep('done');
        callbacksRef.current.setError?.(
          err instanceof Error ? err : new Error('Failed to process map file')
        );
      }
    }
    async function fetchAndLoad() {
      try {
        const mapName = getStoredXodrName(
          useEditorStore.getState().simConfig?.carla?.map
        );
        // The XODR cache is the source of truth on initial editor restore.
        // Keep the visible CARLA map selector aligned with the file actually
        // rendered instead of briefly reverting to defaultSimConfig (Town03).
        const editorMapName = normalizeMapName(mapName);
        const state = useEditorStore.getState();
        if (state.simConfig?.carla?.map !== editorMapName) {
          state.updateSimConfigCarla({ map: editorMapName });
        }
        const cached = getCachedXodrContent();
        if (cached) {
          console.log('[OdrLoader] restoring map content from cache');
          processFile(cached, false);
          return;
        }
        const text = await fetchXodrText(mapName);
        if (cancelled) return;
        console.log(
          `[OdrLoader] map "${mapName}" size: ${(text.length / 1024 / 1024).toFixed(2)} MB`
        );
        processFile(text, false);
      } catch (err) {
        if (cancelled) return;
        console.error(err);
        callbacksRef.current.setStep('done');
        callbacksRef.current.setError?.(
          err instanceof Error ? err : new Error('Failed to load map')
        );
      }
    }
    async function init() {
      callbacksRef.current.setStep('wasm');
      await initXodrCacheFromIndexedDb();
      try {
        const Module = await libOpenDrive();
        if (cancelled) return;
        moduleRef.current = Module as OpenDriveModule;
        callbacksRef.current.setStep('map');
        await fetchAndLoad();
      } catch (err) {
        if (cancelled) return;
        console.error(err);
        callbacksRef.current.setStep('done');
        callbacksRef.current.setError?.(
          err instanceof Error
            ? err
            : new Error('WebAssembly initialization error')
        );
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, [moduleRef, mapRef, loadOdrMapRef]);

  async function loadFile(
    fileText: string,
    clearMap: boolean,
    sourceName?: string
  ): Promise<boolean> {
    if (!moduleRef.current) {
      setStep('done');
      setError?.(new Error('OpenDRIVE module not initialized'));
      return false;
    }
    setStep('map');
    const Module = moduleRef.current;
    const previousMapName = getStoredXodrName(
      useEditorStore.getState().simConfig?.carla?.map
    );
    if (sourceName) setStoredXodrName(sourceName);
    try {
      Module.FS_unlink(MAP_PATH);
    } catch {
      console.warn('FS_unlink failed, maybe /DEFAULT_XODR did not exist yet');
    }

    try {
      Module.FS_createDataFile('.', DEFAULT_XODR, fileText, true, true);
    } catch (err) {
      console.error('FS_createDataFile failed:', err);
      setStep('done');
      setError?.(
        err instanceof Error ? err : new Error('FS_createDataFile failed')
      );
      if (sourceName) setStoredXodrName(previousMapName);
      return false;
    }

    try {
      odrMapRef.current = null;
      mapRef.current?.delete();
      mapRef.current = new Module.OpenDriveMap(MAP_PATH, ODR_MAP_OPTIONS);
    } catch (err) {
      console.error('OpenDriveMap failed:', err);
      setStep('done');
      setError?.(
        err instanceof Error ? err : new Error('OpenDriveMap parse failed')
      );
      if (sourceName) setStoredXodrName(previousMapName);
      return false;
    }

    try {
      const built = await new Promise<boolean>((resolve) => {
        setStep('scene');
        loadOdrMapRef.current(clearMap, true, resolve, fileText);
      });
      if (!built) {
        if (sourceName) setStoredXodrName(previousMapName);
        return false;
      }
      setCachedCustomXodrContent(fileText);
      if (!sourceName) clearStoredXodrName();
      return true;
    } catch (err) {
      console.error('loadOdrMapRef failed:', err);
      setStep('done');
      setError?.(err instanceof Error ? err : new Error('loadOdrMap failed'));
      if (sourceName) setStoredXodrName(previousMapName);
      return false;
    }
  }

  return { loadFile };
}
