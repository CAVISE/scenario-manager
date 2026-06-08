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
import { useEditorStore } from '../../../../../../store';
import type { Car } from '../../../../../../store/types/useEditorStoreTypes';
import { numInputSlot } from '../../../types/PanelTypes';
import { formLabelStyles } from '../types/CarPropertiesTypes';
import OpenCDACollapsibleSection from '../../../../../Editor/components/SimConfigModal/components/OpenCDACollapsibleSection';

export default function CarOpenCDARareSection({ car }: { car: Car }) {
  const updateCar = useEditorStore((s) => s.updateCar);
  const [enabled, setEnabled] = useState(
    car.opencda_spawn_special != null || car.opencda_sensing != null,
  );
  const sensing = car.opencda_sensing ?? {};

  const setSensing = (patch: NonNullable<Car['opencda_sensing']>) => {
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
                <FormLabel sx={formLabelStyles}>spawn_special</FormLabel>
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
                        Math.min(1, Number(e.target.value)),
                      ),
                    })
                  }
                />
              </FormControl>
            )}

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ pt: 0.5 }}
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
              <Stack spacing={1} sx={{ pl: 0.5 }}>
                <FormControlLabel
                  control={
                    <Switch
                      size="small"
                      checked={sensing.perception_activate ?? false}
                      onChange={(e) =>
                        setSensing({ perception_activate: e.target.checked })
                      }
                    />
                  }
                  label="perception.activate"
                />
                <FormControl>
                  <FormLabel sx={formLabelStyles}>camera.visualize</FormLabel>
                  <Input
                    size="small"
                    type="number"
                    slotProps={numInputSlot}
                    value={sensing.camera_visualize ?? ''}
                    placeholder="default"
                    onChange={(e) =>
                      setSensing({
                        camera_visualize: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      })
                    }
                  />
                </FormControl>
                <FormControl>
                  <FormLabel sx={formLabelStyles}>camera.num</FormLabel>
                  <Input
                    size="small"
                    type="number"
                    slotProps={numInputSlot}
                    value={sensing.camera_num ?? ''}
                    placeholder="default"
                    onChange={(e) =>
                      setSensing({
                        camera_num: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      })
                    }
                  />
                </FormControl>
                <FormControlLabel
                  control={
                    <Switch
                      size="small"
                      checked={sensing.lidar_visualize ?? false}
                      onChange={(e) =>
                        setSensing({ lidar_visualize: e.target.checked })
                      }
                    />
                  }
                  label="lidar.visualize"
                />
                <FormControl>
                  <FormLabel sx={formLabelStyles}>lidar.channels</FormLabel>
                  <Input
                    size="small"
                    type="number"
                    slotProps={numInputSlot}
                    value={sensing.lidar_channels ?? ''}
                    placeholder="default"
                    onChange={(e) =>
                      setSensing({
                        lidar_channels: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      })
                    }
                  />
                </FormControl>
                <FormControl>
                  <FormLabel sx={formLabelStyles}>lidar.range (m)</FormLabel>
                  <Input
                    size="small"
                    type="number"
                    slotProps={numInputSlot}
                    value={sensing.lidar_range ?? ''}
                    placeholder="default"
                    onChange={(e) =>
                      setSensing({
                        lidar_range: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      })
                    }
                  />
                </FormControl>
              </Stack>
            )}
          </>
        )}
      </Stack>
    </OpenCDACollapsibleSection>
  );
}
