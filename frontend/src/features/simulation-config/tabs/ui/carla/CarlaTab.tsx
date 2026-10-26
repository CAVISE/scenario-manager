import { Stack } from '@mui/material';
import { useCarlaConfig } from './hooks/useCarlaConfig';
import { MapWeatherSection } from './components/MapWeatherSection';
import { CarlaSettingsSection } from './components/CarlaSettingsSection';
import { WeatherOverrideSection } from './components/WeatherOverrideSection';
import { SensorsSection } from './components/SensorsSection';

interface CarlaTabProps {
  onMapLoaded?: () => void;
}

export default function CarlaTab({ onMapLoaded }: CarlaTabProps) {
  const { simConfig, updateSimConfigCarla, selectedMap, customWeatherEnabled } =
    useCarlaConfig();

  return (
    <Stack spacing={2}>
      <MapWeatherSection
        carla={simConfig.carla}
        selectedMap={selectedMap}
        update={updateSimConfigCarla}
        onMapLoaded={onMapLoaded}
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
