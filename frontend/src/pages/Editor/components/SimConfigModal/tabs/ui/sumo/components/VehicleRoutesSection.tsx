import {
  Box,
  Divider,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';

import { SumoConfig } from '../utils/sumoUtils';
import { Car } from '@/store/types/useEditorStoreTypes';
import { parseNumberInputChange } from '../../../../utils/numberInputUtils';

type Props = {
  cars: Car[];
  vtypes: SumoConfig['vtypes'];
  onUpdateCar: (id: string, patch: Partial<Car>) => void;
};

export const VehicleRoutesSection = ({ cars, vtypes, onUpdateCar }: Props) => {
  if (cars.length === 0) {
    return (
      <>
        <Divider />
        <Typography variant="subtitle2" color="text.secondary">
          Vehicle routes
        </Typography>
        <Typography variant="caption" color="text.secondary">
          No vehicles on scene
        </Typography>
      </>
    );
  }

  return (
    <>
      <Divider />
      <Typography variant="subtitle2" color="text.secondary">
        Vehicle routes
      </Typography>

      {cars.map((car, i) => (
        <Box
          key={car.id}
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            p: 1.5,
          }}
        >
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mb: 1, display: 'block' }}
          >
            {car.model || `Vehicle ${i + 1}`}
          </Typography>
          <Stack spacing={1}>
            <TextField
              label="Route edges"
              size="small"
              fullWidth
              placeholder='e.g. "27 26 -35.0.00"'
              helperText="Leave empty to build the route and spawn automatically from scene points"
              value={car.sumo_edges ?? ''}
              onChange={(e) =>
                onUpdateCar(car.id, { sumo_edges: e.target.value })
              }
            />
            <Stack direction="row" spacing={1}>
              <TextField
                label="Depart (s)"
                type="number"
                size="small"
                fullWidth
                inputProps={{ step: 0.05 }}
                value={car.sumo_depart ?? 0.05}
                onChange={(e) =>
                  onUpdateCar(car.id, {
                    sumo_depart: parseNumberInputChange(e.target),
                  })
                }
              />
              <TextField
                label="Max speed (m/s)"
                type="number"
                size="small"
                fullWidth
                inputProps={{ step: 0.1 }}
                value={car.sumo_max_speed ?? 16.665}
                onChange={(e) =>
                  onUpdateCar(car.id, {
                    sumo_max_speed: parseNumberInputChange(e.target),
                  })
                }
              />
            </Stack>
            <Stack direction="row" spacing={1}>
              <TextField
                label="Depart lane"
                size="small"
                fullWidth
                placeholder='"best" or "4"'
                value={car.sumo_depart_lane ?? ''}
                onChange={(e) =>
                  onUpdateCar(car.id, { sumo_depart_lane: e.target.value })
                }
              />
              <TextField
                label="Depart pos (m)"
                type="number"
                size="small"
                fullWidth
                inputProps={{ step: 1 }}
                placeholder="auto"
                value={car.sumo_depart_pos ?? ''}
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw === '') {
                    onUpdateCar(car.id, { sumo_depart_pos: undefined });
                    return;
                  }
                  const value = Number(raw);
                  if (Number.isNaN(value)) return;
                  onUpdateCar(car.id, { sumo_depart_pos: value });
                }}
              />
            </Stack>
            <FormControl size="small" fullWidth>
              <InputLabel>vType</InputLabel>
              <Select
                value={car.sumo_vtype ?? ''}
                label="vType"
                onChange={(e) =>
                  onUpdateCar(car.id, { sumo_vtype: e.target.value })
                }
              >
                <MenuItem value="">
                  <em>none</em>
                </MenuItem>
                {vtypes.map((vt) => (
                  <MenuItem key={vt.id} value={vt.id}>
                    {vt.id}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControlLabel
              control={
                <Switch
                  checked={!!car.sumo_stop}
                  onChange={(e) =>
                    onUpdateCar(car.id, {
                      sumo_stop: e.target.checked
                        ? {
                            lane: '',
                            startPos: 0,
                            endPos: 5,
                            duration: 100000,
                          }
                        : undefined,
                    })
                  }
                />
              }
              label="Static stop"
            />
            {car.sumo_stop && (
              <Stack direction="row" spacing={1}>
                <TextField
                  label="Lane"
                  size="small"
                  fullWidth
                  placeholder="27_3"
                  value={car.sumo_stop.lane}
                  error={!car.sumo_stop.lane.trim()}
                  helperText={
                    car.sumo_stop.lane.trim() ? undefined : 'Required'
                  }
                  onChange={(e) =>
                    onUpdateCar(car.id, {
                      sumo_stop: { ...car.sumo_stop!, lane: e.target.value },
                    })
                  }
                />
                <TextField
                  label="Start pos"
                  type="number"
                  size="small"
                  sx={{ width: 90 }}
                  value={car.sumo_stop.startPos}
                  onChange={(e) =>
                    onUpdateCar(car.id, {
                      sumo_stop: {
                        ...car.sumo_stop!,
                        startPos: parseNumberInputChange(e.target) || 0,
                      },
                    })
                  }
                />
                <TextField
                  label="End pos"
                  type="number"
                  size="small"
                  sx={{ width: 90 }}
                  value={car.sumo_stop.endPos}
                  onChange={(e) =>
                    onUpdateCar(car.id, {
                      sumo_stop: {
                        ...car.sumo_stop!,
                        endPos: parseNumberInputChange(e.target) || 0,
                      },
                    })
                  }
                />
                <TextField
                  label="Duration (s)"
                  type="number"
                  size="small"
                  sx={{ width: 100 }}
                  value={car.sumo_stop.duration}
                  onChange={(e) =>
                    onUpdateCar(car.id, {
                      sumo_stop: {
                        ...car.sumo_stop!,
                        duration: parseNumberInputChange(e.target) || 0,
                      },
                    })
                  }
                />
              </Stack>
            )}
          </Stack>
        </Box>
      ))}
    </>
  );
};
