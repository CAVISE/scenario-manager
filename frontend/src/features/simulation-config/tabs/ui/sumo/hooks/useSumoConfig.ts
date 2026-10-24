import { getLoadedSumoNetwork, setLoadedSumoNetwork } from '@scenario-export';
import { mergeSimConfigWithDefaults, defaultSimConfig } from '@scenario-export';
import { useEditorStore } from '@/store';
import { useEffect, useMemo, useRef, useState } from 'react';

export const useSumoConfig = () => {
  const rawSimConfig = useEditorStore((s) => s.simConfig);
  const simConfig = useMemo(
    () => mergeSimConfigWithDefaults(rawSimConfig),
    [rawSimConfig]
  );

  const sumo = simConfig.sumo ?? defaultSimConfig.sumo;
  const updateSimConfigSumo = useEditorStore((s) => s.updateSimConfigSumo);
  const setError = useEditorStore((s) => s.setError);
  const cars = useEditorStore((s) => s.cars);
  const updateCar = useEditorStore((s) => s.updateCar);

  const [loadedNetFilename, setLoadedNetFilename] = useState(
    getLoadedSumoNetwork()?.filename ?? ''
  );
  const networkLoadRequestRef = useRef(0);

  useEffect(
    () => () => {
      networkLoadRequestRef.current += 1;
    },
    []
  );

  const handleLoadNetwork = async (file: File) => {
    const requestId = ++networkLoadRequestRef.current;
    try {
      const content = await file.text();
      if (requestId !== networkLoadRequestRef.current) return;
      setLoadedSumoNetwork(file.name, content);
      setLoadedNetFilename(file.name);
    } catch (error) {
      if (requestId !== networkLoadRequestRef.current) return;
      setError(error instanceof Error ? error : new Error(String(error)));
    }
  };

  return {
    simConfig,
    sumo,
    cars,
    updateSimConfigSumo,
    updateCar,
    loadedNetFilename,
    setLoadedNetFilename,
    handleLoadNetwork,
  };
};
