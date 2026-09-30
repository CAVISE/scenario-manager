import {
  FormControl,
  FormControlLabel,
  FormLabel,
  Input,
  Stack,
  Switch,
} from '@mui/material';
import { useEditorStore } from '@/store';
import type { CarV2XSectionProps } from '../types/CarPropertiesTypes';
import { numInputSlot } from '@/shared/utils/numberInputUtils';
import { parseNumberFromEvent } from '../utils/carOpenCDAHelpers';
import '../styles/CarPropertiesSections.scss';

export function CarV2XSection({
  car,
  showV2x,
  setShowV2x,
}: CarV2XSectionProps) {
  const updateCar = useEditorStore((s) => s.updateCar);

  return (
    <>
      <FormControlLabel
        control={
          <Switch
            size="small"
            checked={showV2x}
            onChange={(e) => {
              setShowV2x(e.target.checked);
              updateCar(car.id, {
                opencda_v2x: e.target.checked
                  ? { enabled: true, communication_range: 45 }
                  : undefined,
              });
            }}
          />
        }
        label="V2X override"
      />
      {showV2x && (
        <Stack spacing={1} className="car-properties-section__nested">
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={car.opencda_v2x?.enabled ?? true}
                onChange={(e) =>
                  updateCar(car.id, {
                    opencda_v2x: {
                      ...car.opencda_v2x,
                      enabled: e.target.checked,
                    },
                  })
                }
              />
            }
            label="enabled"
          />
          <FormControl>
            <FormLabel>communication_range (m)</FormLabel>
            <Input
              size="small"
              type="number"
              slotProps={numInputSlot}
              value={car.opencda_v2x?.communication_range ?? 45}
              onChange={(e) => {
                const parsed = parseNumberFromEvent(e);
                if (parsed === undefined) return;
                updateCar(car.id, {
                  opencda_v2x: {
                    ...car.opencda_v2x,
                    communication_range: parsed,
                  },
                });
              }}
            />
          </FormControl>
        </Stack>
      )}
    </>
  );
}
