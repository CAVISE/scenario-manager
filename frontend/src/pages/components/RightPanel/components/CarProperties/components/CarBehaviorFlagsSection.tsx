import { FormControlLabel, Stack, Switch } from '@mui/material';
import { useEditorStore } from '../../../../../../store';
import type { Car } from '../../../../../../store/types/useEditorStoreTypes';

interface CarBehaviorFlagsSectionProps {
  car: Car;
  showBehaviorFlags: boolean;
  setShowBehaviorFlags: (value: boolean) => void;
}

export function CarBehaviorFlagsSection({
  car,
  showBehaviorFlags,
  setShowBehaviorFlags,
}: CarBehaviorFlagsSectionProps) {
  const updateCar = useEditorStore((s) => s.updateCar);

  return (
    <>
      <FormControlLabel
        control={
          <Switch
            size="small"
            checked={showBehaviorFlags}
            onChange={(e) => {
              setShowBehaviorFlags(e.target.checked);
              if (e.target.checked) {
                updateCar(car.id, {
                  opencda_ignore_traffic_light: false,
                  opencda_overtake_allowed: false,
                });
              } else {
                updateCar(car.id, {
                  opencda_ignore_traffic_light: undefined,
                  opencda_overtake_allowed: undefined,
                });
              }
            }}
          />
        }
        label="ignore_traffic_light / overtake overrides"
      />
      {showBehaviorFlags && (
        <Stack spacing={0.5} sx={{ pl: 1 }}>
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={car.opencda_ignore_traffic_light ?? false}
                onChange={(e) =>
                  updateCar(car.id, {
                    opencda_ignore_traffic_light: e.target.checked,
                  })
                }
              />
            }
            label="ignore_traffic_light"
          />
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={car.opencda_overtake_allowed ?? false}
                onChange={(e) =>
                  updateCar(car.id, {
                    opencda_overtake_allowed: e.target.checked,
                  })
                }
              />
            }
            label="overtake_allowed"
          />
        </Stack>
      )}
    </>
  );
}
