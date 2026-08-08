import { FormControlLabel, Stack, Switch } from '@mui/material';
import OpenCDACollapsibleSection from '../../../../components/OpenCDACollapsibleSection';
import { SimulationConfig } from '../../../../../../Generators/types/configGeneratorsTypes';

type Props = {
  oc: Partial<SimulationConfig['opencda']>;
  update: (patch: Partial<SimulationConfig['opencda']>) => void;
};

const TOGGLES = [
  ['export_attacks', 'attacks: []'],
  ['export_platoon_base', 'platoon_base + empty platoon_list'],
  ['export_metrics', 'localization/behavior metrics'],
  ['export_coop_perception', 'cooperative_perception_visualization'],
  ['export_vehicle_behavior_services', 'vehicle_base behavior_services'],
  ['export_world_client_host', 'world.client_host'],
] as const;

export const ExportTogglesSection = ({ oc, update }: Props) => (
  <OpenCDACollapsibleSection title="Export toggles">
    <Stack spacing={0.5}>
      {TOGGLES.map(([key, label]) => (
        <FormControlLabel
          key={key}
          control={
            <Switch
              size="small"
              checked={oc[key]}
              onChange={(e) => update({ [key]: e.target.checked })}
            />
          }
          label={label}
        />
      ))}
    </Stack>
  </OpenCDACollapsibleSection>
);
