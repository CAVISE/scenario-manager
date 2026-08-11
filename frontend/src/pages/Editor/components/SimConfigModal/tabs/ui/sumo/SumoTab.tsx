import { Stack } from '@mui/material';
import { useSumoConfig } from './hooks/useSumoConfig';
import { SumoFilesSection } from './components/SumoFilesSection';
import { VTypesSection } from './components/VTypesSection';
import { VehicleRoutesSection } from './components/VehicleRoutesSection';

export default function SumoTab() {
  const {
    simConfig,
    sumo,
    cars,
    updateSimConfigSumo,
    updateCar,
    loadedNetFilename,
    setLoadedNetFilename,
    handleLoadNetwork,
  } = useSumoConfig();

  return (
    <Stack spacing={2}>
      <SumoFilesSection
        sumo={sumo}
        carlaMap={simConfig.carla.map}
        loadedNetFilename={loadedNetFilename}
        onUpdate={updateSimConfigSumo}
        onLoadNetwork={handleLoadNetwork}
        onNetFileChange={setLoadedNetFilename}
      />
      <VTypesSection sumo={sumo} onUpdate={updateSimConfigSumo} />
      <VehicleRoutesSection
        cars={cars}
        vtypes={sumo.vtypes}
        onUpdateCar={updateCar}
      />
    </Stack>
  );
}
