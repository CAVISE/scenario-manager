import { FormControlLabel, Stack, Switch } from '@mui/material';
import OpenCDACollapsibleSection from '../../../OpenCDACollapsibleSection';
import type { OpenCDAConfig, OpenCDASectionProps } from '../opencda.types';

export const BehaviorServicesSection = ({
  oc,
  update,
}: OpenCDASectionProps) => {
  const patchBehaviorServices = (
    field: keyof OpenCDAConfig['vehicle_behavior_services'],
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
