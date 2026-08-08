import { Stack } from '@mui/material';
import { useMpcConfig } from './hooks/useMpcConfig';
import { SystemSection } from './components/SystemSection';
import { SimulationSection } from './components/SimulationSection';
import { MPCWeightsSection } from './components/MPCWeightsSection';
import { VehicleGeometrySection } from './components/VehicleGeometrySection';
import { LimitsSection } from './components/LimitsSection';

export default function MpcTab() {
  const { mpc, updateSimConfigMPC } = useMpcConfig();

  return (
    <Stack spacing={2}>
      <SystemSection mpc={mpc} update={updateSimConfigMPC} />
      <SimulationSection mpc={mpc} update={updateSimConfigMPC} />
      <MPCWeightsSection mpc={mpc} update={updateSimConfigMPC} />
      <VehicleGeometrySection mpc={mpc} update={updateSimConfigMPC} />
      <LimitsSection mpc={mpc} update={updateSimConfigMPC} />
    </Stack>
  );
}
