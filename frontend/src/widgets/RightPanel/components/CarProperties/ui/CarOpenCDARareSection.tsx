import { useState } from 'react';
import {
  FormControl,
  FormControlLabel,
  FormLabel,
  Input,
  Stack,
  Switch,
  Typography,
} from '@mui/material';

import type { Car } from '@/entities/vehicle';
import { useEditorStore } from '@/store';
import { OpenCDACollapsibleSection } from '@/features/simulation-config';
import { parseNumberInputChange } from '@/shared/utils/numberInputUtils';
import { numInputSlot } from '@/shared/utils/numberInputUtils';
import type { CarSectionProps } from '../types/CarPropertiesTypes';
import { CarOpenCDASensingFields } from './CarOpenCDASensingFields';
import '../styles/CarPropertiesSections.scss';
export default function CarOpenCDARareSection({ car }: CarSectionProps) {
  const updateCar = useEditorStore((s) => s.updateCar);
  const [enabled, setEnabled] = useState(
    car.opencda_spawn_special != null || car.opencda_sensing != null
  );
  const sensing = car.opencda_sensing ?? {};

  const setSensing = (patch: Partial<NonNullable<Car['opencda_sensing']>>) => {
    updateCar(car.id, {
      opencda_sensing: { ...sensing, ...patch },
    });
  };

  return (
    <OpenCDACollapsibleSection title="Rare CAV fields (spawn_special, sensing)">
      <Stack spacing={1}>
        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={enabled}
              onChange={(e) => {
                setEnabled(e.target.checked);
                if (!e.target.checked) {
                  updateCar(car.id, {
                    opencda_spawn_special: undefined,
                    opencda_sensing: undefined,
                  });
                }
              }}
            />
          }
          label="Enable overrides"
        />

        {enabled && (
          <>
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={car.opencda_spawn_special != null}
                  onChange={(e) =>
                    updateCar(car.id, {
                      opencda_spawn_special: e.target.checked ? 0.5 : undefined,
                    })
                  }
                />
              }
              label="spawn_special (merge lane ratio 0–1)"
            />
            {car.opencda_spawn_special != null && (
              <FormControl>
                <FormLabel className="car-properties-section__label">
                  spawn_special
                </FormLabel>
                <Input
                  size="small"
                  type="number"
                  slotProps={numInputSlot}
                  inputProps={{ min: 0, max: 1, step: 0.05 }}
                  value={car.opencda_spawn_special}
                  onChange={(e) =>
                    updateCar(car.id, {
                      opencda_spawn_special: Math.max(
                        0,
                        Math.min(1, parseNumberInputChange(e.target) || 0)
                      ),
                    })
                  }
                />
              </FormControl>
            )}

            <Typography
              variant="caption"
              className="car-properties-section__caption"
              sx={{
                color: 'text.secondary',
              }}
            >
              sensing / perception
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={car.opencda_sensing != null}
                  onChange={(e) =>
                    updateCar(car.id, {
                      opencda_sensing: e.target.checked ? {} : undefined,
                    })
                  }
                />
              }
              label="sensing block"
            />

            {car.opencda_sensing != null && (
              <CarOpenCDASensingFields
                sensing={sensing}
                onUpdate={setSensing}
              />
            )}
          </>
        )}
      </Stack>
    </OpenCDACollapsibleSection>
  );
}
