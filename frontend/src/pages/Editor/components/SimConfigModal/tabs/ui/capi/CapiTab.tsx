import { Stack } from '@mui/material';
import { useCapiConfig } from './hooks/useCapiConfig';
import { NetworkSection } from './components/NetworkSection';
import { CommandEnvSection } from './components/CommandEnvSection';
import { CAPIConnectionSection } from './components/CAPIConnectionSection';
import { TraCISection } from './components/TraCISection';
import { RadioSection } from './components/RadioSection';
import { MiddlewareSection } from './components/MiddlewareSection';
import { ServicesSection } from './components/ServicesSection';
import { ExtraConfigsSection } from './components/ExtraConfigsSection';

export default function CapiTab() {
  const { capi, updateSimConfigCAPI } = useCapiConfig();

  return (
    <Stack spacing={2}>
      <NetworkSection capi={capi} update={updateSimConfigCAPI} />
      <CommandEnvSection capi={capi} update={updateSimConfigCAPI} />
      <CAPIConnectionSection capi={capi} update={updateSimConfigCAPI} />
      <TraCISection capi={capi} update={updateSimConfigCAPI} />
      <RadioSection capi={capi} update={updateSimConfigCAPI} />
      <MiddlewareSection capi={capi} update={updateSimConfigCAPI} />
      <ServicesSection capi={capi} update={updateSimConfigCAPI} />
      <ExtraConfigsSection capi={capi} update={updateSimConfigCAPI} />
    </Stack>
  );
}
