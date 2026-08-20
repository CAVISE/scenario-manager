import {
  getLoadedSumoNetwork,
  setLoadedSumoNetwork,
} from '@editor/Generators/exporters';
import {
  mergeSimConfigWithDefaults,
  defaultSimConfig,
} from '@editor/Generators/types/configGeneratorsTypes';
import { useEditorStore } from '@/store';
import { useMemo, useState } from 'react';

export const useSumoConfig = () => {
  const rawSimConfig = useEditorStore((s) => s.simConfig);
  const simConfig = useMemo(
    () => mergeSimConfigWithDefaults(rawSimConfig),
    [rawSimConfig],
  );

  const sumo = simConfig.sumo ?? defaultSimConfig.sumo;
  const updateSimConfigSumo = useEditorStore((s) => s.updateSimConfigSumo);
  const setError = useEditorStore((s) => s.setError);
  const cars = useEditorStore((s) => s.cars);
  const updateCar = useEditorStore((s) => s.updateCar);

  const [loadedNetFilename, setLoadedNetFilename] = useState(
    getLoadedSumoNetwork()?.filename ?? '',
  );

  const handleLoadNetwork = async (file: File) => {
    try {
      setLoadedSumoNetwork(file.name, await file.text());
      setLoadedNetFilename(file.name);
    } catch (error) {
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
