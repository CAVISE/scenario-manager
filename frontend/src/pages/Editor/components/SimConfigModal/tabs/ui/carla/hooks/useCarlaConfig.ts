import { useMemo } from 'react';
import { toCarlaMapNameFromXodr } from '../utils/carlaUtils';
import { getStoredXodrName } from '@editor/hooks/useThreeScene/hooks/useOdrLoader/utils/xodrRepository';
import { useEditorStore } from '@/store';
import { CARLA_MAPS } from '../../../../types/SimConfigModalTypes';

export const useCarlaConfig = () => {
  const simConfig = useEditorStore((s) => s.simConfig);
  const updateSimConfigCarla = useEditorStore((s) => s.updateSimConfigCarla);

  const storedMap = useMemo(
    () => toCarlaMapNameFromXodr(getStoredXodrName(simConfig.carla.map)),
    [simConfig.carla.map],
  );

  const selectedMap = CARLA_MAPS.includes(simConfig.carla.map)
    ? simConfig.carla.map
    : storedMap || 'Town03';

  const customWeatherEnabled =
    Object.keys(simConfig.carla.weather_override ?? {}).length > 0;

  return {
    simConfig,
    updateSimConfigCarla,
    storedMap,
    selectedMap,
    customWeatherEnabled,
  };
};
