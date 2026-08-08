import { useMemo, useState } from 'react';
import { useEditorStore } from '../../../../../../../../store';
import {
  getLoadedSumoNetwork,
  setLoadedSumoNetwork,
} from '../../../../../../Generators/exporters';
import {
  mergeSimConfigWithDefaults,
  defaultSimConfig,
} from '../../../../../../Generators/types/configGeneratorsTypes';

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
