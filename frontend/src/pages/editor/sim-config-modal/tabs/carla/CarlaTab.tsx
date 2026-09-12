import { Stack } from '@mui/material';
import { useCarlaConfig } from './hooks/useCarlaConfig';
import { MapWeatherSection } from './components/MapWeatherSection';
import { CarlaSettingsSection } from './components/CarlaSettingsSection';
import { WeatherOverrideSection } from './components/WeatherOverrideSection';
import { SensorsSection } from './components/SensorsSection';
import { useEffect } from 'react';

export default function CarlaTab() {
  const {
    simConfig,
    updateSimConfigCarla,
    storedMap,
    selectedMap,
    customWeatherEnabled,
  } = useCarlaConfig();

  useEffect(() => {
    if (storedMap && storedMap !== simConfig.carla.map) {
      updateSimConfigCarla({ map: storedMap });
    }
  }, [simConfig.carla.map, storedMap, updateSimConfigCarla]);

  return (
    <Stack spacing={2}>
      <MapWeatherSection
        carla={simConfig.carla}
        selectedMap={selectedMap}
        update={updateSimConfigCarla}
      />
      <CarlaSettingsSection
        carla={simConfig.carla}
        update={updateSimConfigCarla}
      />
      <WeatherOverrideSection
        carla={simConfig.carla}
        customWeatherEnabled={customWeatherEnabled}
        update={updateSimConfigCarla}
      />
      <SensorsSection carla={simConfig.carla} update={updateSimConfigCarla} />
    </Stack>
  );
}
