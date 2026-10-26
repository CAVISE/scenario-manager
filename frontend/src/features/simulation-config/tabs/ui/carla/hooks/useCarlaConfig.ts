import { useEditorStore } from '@/store';

export const useCarlaConfig = () => {
  const simConfig = useEditorStore((s) => s.simConfig);
  const updateSimConfigCarla = useEditorStore((s) => s.updateSimConfigCarla);

  const selectedMap = simConfig.carla.map;

  const customWeatherEnabled =
    Object.keys(simConfig.carla.weather_override ?? {}).length > 0;

  return {
    simConfig,
    updateSimConfigCarla,
    selectedMap,
    customWeatherEnabled,
  };
};
