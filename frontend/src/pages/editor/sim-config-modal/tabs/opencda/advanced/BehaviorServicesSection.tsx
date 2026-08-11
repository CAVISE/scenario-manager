import { FormControlLabel, Stack, Switch } from '@mui/material';
import OpenCDACollapsibleSection from '../../../OpenCDACollapsibleSection';
import { SimulationConfig } from '../../../../generators/generators.types';

type Props = {
  oc: SimulationConfig['opencda'];
  update: (patch: Partial<SimulationConfig['opencda']>) => void;
};

export const BehaviorServicesSection = ({ oc, update }: Props) => {
  const patchBehaviorServices = (
    field: keyof SimulationConfig['opencda']['vehicle_behavior_services'],
    value: boolean,
  ) => {
    update({
      vehicle_behavior_services: {
        ...oc.vehicle_behavior_services,
        [field]: value,
      },
    });
  };

  return (
    <OpenCDACollapsibleSection title="vehicle_base behavior_services (global)">
      <Stack spacing={0.5}>
        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={oc.vehicle_behavior_services.self_informer}
              onChange={(e) =>
                patchBehaviorServices('self_informer', e.target.checked)
              }
            />
          }
          label="self_informer"
        />
        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={oc.vehicle_behavior_services.movement_controller}
              onChange={(e) =>
                patchBehaviorServices('movement_controller', e.target.checked)
              }
            />
          }
          label="movement_controller"
        />
      </Stack>
    </OpenCDACollapsibleSection>
  );
};
