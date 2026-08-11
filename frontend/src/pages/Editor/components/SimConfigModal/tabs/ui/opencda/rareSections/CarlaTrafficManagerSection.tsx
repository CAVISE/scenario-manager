import { Stack } from '@mui/material';
import { NumField } from '../rareComponents/NumField';
import OpenCDACollapsibleSection from '../../../../components/OpenCDACollapsibleSection';
import { SimulationConfig } from '../../../../../../Generators/types/configGeneratorsTypes';

type Props = {
  oc: Partial<SimulationConfig['opencda']>;
  update: (patch: Partial<SimulationConfig['opencda']>) => void;
};

export const CarlaTrafficManagerSection = ({ oc, update }: Props) => (
  <OpenCDACollapsibleSection title="carla_traffic_manager (extra %)">
    <Stack spacing={1}>
      <NumField
        label="ignore_vehicles_percentage"
        value={oc.ignore_vehicles_percentage ?? 0}
        onChange={(v) => update({ ignore_vehicles_percentage: v })}
        min={0}
        max={100}
      />
      <NumField
        label="random_left_lanechange_percentage"
        value={oc.random_left_lanechange_percentage ?? 0}
        onChange={(v) => update({ random_left_lanechange_percentage: v })}
        min={0}
        max={100}
      />
      <NumField
        label="random_right_lanechange_percentage"
        value={oc.random_right_lanechange_percentage ?? 0}
        onChange={(v) => update({ random_right_lanechange_percentage: v })}
        min={0}
        max={100}
      />
    </Stack>
  </OpenCDACollapsibleSection>
);
