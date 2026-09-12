import { Box, Divider, Stack, Typography } from '@mui/material';
import {
  opencdaPanelPaperSx,
  opencdaSectionLabelSx,
} from '../../../../../shared/styles/opencdaUiStyles';
import type {
  OpenCDAAdvancedSectionsProps,
  OpenCDAConfig,
} from './opencda.types';

import {
  ExportTogglesSection,
  GNSSDebugSection,
  MapManagerSection,
  SafetyManagerSection,
  ControllerPIDSection,
  PlatoonBaseSection,
  MetricsSection,
  CoopPerceptionSection,
  CarlaTrafficManagerSection,
  BehaviorServicesSection,
  WorldClientHostField,
} from './advanced';

export default function OpenCDAAdvancedSections({
  oc,
  update,
}: OpenCDAAdvancedSectionsProps) {
  const patchMm = (p: Partial<OpenCDAConfig['map_manager']>) =>
    update({ map_manager: { ...oc.map_manager, ...p } });
  const patchSm = (p: Partial<OpenCDAConfig['safety_manager']>) =>
    update({ safety_manager: { ...oc.safety_manager, ...p } });
  const patchCtrl = (p: Partial<OpenCDAConfig['controller_pid']>) =>
    update({ controller_pid: { ...oc.controller_pid, ...p } });
  const patchPb = (p: Partial<OpenCDAConfig['platoon_base']>) =>
    update({ platoon_base: { ...oc.platoon_base, ...p } });
  const patchMet = (p: Partial<OpenCDAConfig['metrics']>) =>
    update({ metrics: { ...oc.metrics, ...p } });
  const patchCp = (p: Partial<OpenCDAConfig['coop_perception']>) =>
    update({ coop_perception: { ...oc.coop_perception, ...p } });
  const patchGnss = (p: Partial<OpenCDAConfig['gnss_noise']>) =>
    update({ gnss_noise: { ...oc.gnss_noise, ...p } });

  return (
    <Stack spacing={1.5}>
      <Divider sx={{ my: 0.5 }} />
      <Box sx={opencdaPanelPaperSx}>
        <Typography sx={opencdaSectionLabelSx}>
          Advanced / optional YAML
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          display="block"
          sx={{ mt: 0.5 }}
        >
          Rare blocks used in scenario_testing configs — expand only what you
          need.
        </Typography>
      </Box>

      <ExportTogglesSection oc={oc} update={update} />
      <GNSSDebugSection oc={oc} patchGnss={patchGnss} update={update} />
      <MapManagerSection mapManager={oc.map_manager} patch={patchMm} />
      <SafetyManagerSection safetyManager={oc.safety_manager} patch={patchSm} />
      <ControllerPIDSection controller={oc.controller_pid} patch={patchCtrl} />
      <PlatoonBaseSection platoonBase={oc.platoon_base} patch={patchPb} />
      <MetricsSection metrics={oc.metrics} patch={patchMet} />
      <CoopPerceptionSection
        coopPerception={oc.coop_perception}
        patch={patchCp}
      />
      <CarlaTrafficManagerSection oc={oc} update={update} />
      <BehaviorServicesSection oc={oc} update={update} />
      <WorldClientHostField oc={oc} update={update} />
    </Stack>
  );
}
