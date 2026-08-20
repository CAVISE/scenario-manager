import { OpenDriveModule } from '@editor/hooks/useOpenDriveUtils/useOdrMap/types/useOdrMapTypes';
import { libOpenDrive } from '@editor/types/editorTypes';
import { useEditorStore } from '@/store';
import { useEffect } from 'react';
import {
  UseOdrLoaderProps,
  MAP_PATH,
  ODR_MAP_OPTIONS,
} from '../types/useOdrLoaderTypes';
import {
  setCachedCustomXodrContent,
  DEFAULT_XODR,
  getCachedXodrContent,
  getStoredXodrName,
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
  loadOdrMapRef,
}: UseOdrLoaderProps) {
  useEffect(() => {
    let cancelled = false;
    function processFile(fileText: string, clearMap: boolean) {
      const Module = moduleRef.current;
      if (!Module || cancelled) return;
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

        mapRef.current?.delete();
        mapRef.current = new Module.OpenDriveMap(MAP_PATH, ODR_MAP_OPTIONS);

        setStep('scene');

        loadOdrMapRef.current(clearMap);
      } catch (err) {
        console.error(err);
        setStep('done');
        setError?.(
          err instanceof Error ? err : new Error('Failed to process map file')
        );
      }
    }

    async function fetchAndLoad() {
      try {
        const cached = getCachedXodrContent();
        if (cached) {
          console.log('[OdrLoader] restoring map content from cache');
          processFile(cached, false);
          return;
        }

        const mapName = getStoredXodrName(
          useEditorStore.getState().simConfig?.carla?.map
        );
        const text = await fetchXodrText(mapName);
        if (cancelled) return;
        console.log(
          `[OdrLoader] map "${mapName}" size: ${(text.length / 1024 / 1024).toFixed(2)} MB`
        );
        processFile(text, false);
      } catch (err) {
        if (cancelled) return;
        console.error(err);
        setStep('done');
        setError?.(
          err instanceof Error ? err : new Error('Failed to load map')
        );
      }
    }

    async function init() {
      setStep('wasm');

      await initXodrCacheFromIndexedDb();
      try {
        const Module = await libOpenDrive();

        if (cancelled) return;

        moduleRef.current = Module as OpenDriveModule;
        setStep('map');

        await fetchAndLoad();
      } catch (err) {
        if (cancelled) return;
        console.error(err);
        setStep('done');
        setError?.(
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function loadFile(fileText: string, clearMap: boolean, sourceName?: string) {
    if (!moduleRef.current) {
      setStep('done');
      setError?.(new Error('OpenDRIVE module not initialized'));
      return;
    }
    setCachedCustomXodrContent(fileText);

    if (sourceName) {
      setStoredXodrName(sourceName);
    } else {
      clearStoredXodrName();
    }
    setStep('map');
    const Module = moduleRef.current;

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
      return;
    }

    try {
      mapRef.current?.delete();
      mapRef.current = new Module.OpenDriveMap(MAP_PATH, ODR_MAP_OPTIONS);
    } catch (err) {
      console.error('OpenDriveMap failed:', err);
      setStep('done');
      setError?.(
        err instanceof Error ? err : new Error('OpenDriveMap parse failed')
      );
      return;
    }

    try {
      setStep('scene');
      loadOdrMapRef.current(clearMap);
    } catch (err) {
      console.error('loadOdrMapRef failed:', err);
      setStep('done');
      setError?.(err instanceof Error ? err : new Error('loadOdrMap failed'));
    }
  }

  return { loadFile };
}
