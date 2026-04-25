import { useEffect } from 'react';
import { libOpenDrive } from '../../../../../types/editorTypes';
import { useEditorStore } from '../../../../../../../store';
import type { OpenDriveModule } from '../../../../useOpenDriveUtils/useOdrMap/types/useOdrMapTypes';
import {
  CACHE_KEY,
  MAP_PATH,
  ODR_MAP_OPTIONS,
  UseOdrLoaderProps,
} from '../types/useOdrLoaderTypes';

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
      if (clearMap) {
        localStorage.setItem(CACHE_KEY, fileText);
        const s = useEditorStore.getState();
        s.cars.forEach((c) => s.removeCar(c.id));
        while (useEditorStore.getState().RSUs.length > 0) {
          useEditorStore.getState().removeRSU(0);
        }
        s.points.forEach((p) => s.removePoint(p.id));
        s.buildings.forEach((b) => s.removeBuilding(b.id));

        setTimeout(() => localStorage.removeItem('editor-scenario-cache'), 100);

        try {
          Module.FS_unlink(MAP_PATH);
        } catch (err) {
          console.warn('FS_unlink skipped:', err);
        }
      }

      try {
        Module.FS_createDataFile('.', 'data.xodr', fileText, true, true);

        mapRef.current?.delete();
        mapRef.current = new Module.OpenDriveMap(MAP_PATH, ODR_MAP_OPTIONS);

        setStep('scene');

        loadOdrMapRef.current(clearMap);
      } catch (err) {
        console.error(err);
        setStep('done');
        setError?.(
          err instanceof Error ? err : new Error('Failed to process map file'),
        );
      }
    }

    async function fetchAndLoad() {
      try {
        const response = await fetch(MAP_PATH);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const text = await response.text();
        if (cancelled) return;
        localStorage.setItem(CACHE_KEY, text);
        processFile(text, false);
      } catch (err) {
        if (cancelled) return;
        console.error(err);
        setStep('done');
        setError?.(
          err instanceof Error ? err : new Error('Failed to load map'),
        );
      }
    }

    async function init() {
      setStep('wasm');
      try {
        const Module = await libOpenDrive();

        if (cancelled) return;

        moduleRef.current = Module as OpenDriveModule;
        setStep('map');

        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          processFile(cached, false);
        } else {
          await fetchAndLoad();
        }
      } catch (err) {
        if (cancelled) return;
        console.error(err);
        setStep('done');
        setError?.(
          err instanceof Error
            ? err
            : new Error('WebAssembly initialization error'),
        );
      }
    }

    init();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function loadFile(fileText: string, clearMap: boolean) {
    if (!moduleRef.current) {
      setStep('done');
      setError?.(new Error('OpenDRIVE module not initialized'));
      return;
    }
    const Module = moduleRef.current;

    if (clearMap) {
      localStorage.setItem(CACHE_KEY, fileText);
      const s = useEditorStore.getState();
      s.cars.forEach((c) => s.removeCar(c.id));
      while (useEditorStore.getState().RSUs.length > 0) {
        useEditorStore.getState().removeRSU(0);
      }
      s.points.forEach((p) => s.removePoint(p.id));
      s.buildings.forEach((b) => s.removeBuilding(b.id));
      setTimeout(() => localStorage.removeItem('editor-scenario-cache'), 100);

      try {
        Module.FS_unlink(MAP_PATH);
      } catch (err) {
        console.error(err);
        setStep('done');
        setError?.(
          err instanceof Error ? err : new Error('Failed to process map file'),
        );
        return;
      }
    }

    try {
      Module.FS_createDataFile('.', 'data.xodr', fileText, true, true);
      mapRef.current?.delete();
      mapRef.current = new Module.OpenDriveMap(MAP_PATH, ODR_MAP_OPTIONS);
      setStep('scene');
      loadOdrMapRef.current(clearMap);
    } catch (err) {
      console.error(err);
      setStep('done');
      setError?.(
        err instanceof Error ? err : new Error('Failed to process map file'),
      );
    }
  }

  return { loadFile };
}
