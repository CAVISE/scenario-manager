import {
  Box,
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
import type { Car } from '@/entities/vehicle';
import { parseNumberInputChange } from '@/shared/utils/numberInputUtils';
import type { SumoConfig } from '../types/sumoTypes';

interface VehicleRouteCardProps {
  car: Car;
  index: number;
  vtypes: SumoConfig['vtypes'];
  onUpdate: (patch: Partial<Car>) => void;
}

const DEFAULT_STOP = { lane: '', startPos: 0, endPos: 5, duration: 100000 };

export function VehicleRouteCard({
  car,
  index,
  vtypes,
  onUpdate,
}: VehicleRouteCardProps) {
  const stop = car.sumo_stop;
  const updateStop = (patch: Partial<NonNullable<Car['sumo_stop']>>) =>
    onUpdate({ sumo_stop: { ...stop!, ...patch } });

  return (
    <Box className="sim-config-card">
      <Typography
        variant="caption"
        className="sim-config-card-title"
        sx={{
          color: 'text.secondary',
        }}
      >
        {car.model || `Vehicle ${index + 1}`}
      </Typography>
      <Stack spacing={1}>
        <TextField
          label="Route edges"
          size="small"
          fullWidth
          placeholder='e.g. "27 26 -35.0.00"'
          helperText="Leave empty to build the route and spawn automatically from scene points"
          value={car.sumo_edges ?? ''}
          onChange={(event) => onUpdate({ sumo_edges: event.target.value })}
        />
        <Stack direction="row" spacing={1}>
          <TextField
            label="Depart (s)"
            type="number"
            size="small"
            fullWidth
            value={car.sumo_depart ?? 0.05}
            onChange={(event) =>
              onUpdate({ sumo_depart: parseNumberInputChange(event.target) })
            }
            slotProps={{
              htmlInput: { step: 0.05 },
            }}
          />
          <TextField
            label="Max speed (m/s)"
            type="number"
            size="small"
            fullWidth
            value={car.sumo_max_speed ?? 16.665}
            onChange={(event) =>
              onUpdate({ sumo_max_speed: parseNumberInputChange(event.target) })
            }
            slotProps={{
              htmlInput: { step: 0.1 },
            }}
          />
        </Stack>
        <Stack direction="row" spacing={1}>
          <TextField
            label="Depart lane"
            size="small"
            fullWidth
            placeholder='"best" or "4"'
            value={car.sumo_depart_lane ?? ''}
            onChange={(event) =>
              onUpdate({ sumo_depart_lane: event.target.value })
            }
          />
          <TextField
            label="Depart pos (m)"
            type="number"
            size="small"
            fullWidth
            placeholder="auto"
            value={car.sumo_depart_pos ?? ''}
            onChange={(event) => {
              const raw = event.target.value;
              if (raw === '') {
                onUpdate({ sumo_depart_pos: undefined });
                return;
              }
              const value = Number(raw);
              if (!Number.isNaN(value)) onUpdate({ sumo_depart_pos: value });
            }}
            slotProps={{
              htmlInput: { step: 1 },
            }}
          />
        </Stack>
        <FormControl size="small" fullWidth>
          <InputLabel>vType</InputLabel>
          <Select
            value={car.sumo_vtype ?? ''}
            label="vType"
            onChange={(event) => onUpdate({ sumo_vtype: event.target.value })}
          >
            <MenuItem value="">
              <em>none</em>
            </MenuItem>
            {vtypes.map((vtype) => (
              <MenuItem key={vtype.id} value={vtype.id}>
                {vtype.id}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControlLabel
          control={
            <Switch
              checked={!!stop}
              onChange={(event) =>
                onUpdate({
                  sumo_stop: event.target.checked ? DEFAULT_STOP : undefined,
                })
              }
            />
          }
          label="Static stop"
        />
        {stop && (
          <Stack direction="row" spacing={1}>
            <TextField
              label="Lane"
              size="small"
              fullWidth
              placeholder="27_3"
              value={stop.lane}
              error={!stop.lane.trim()}
              helperText={stop.lane.trim() ? undefined : 'Required'}
              onChange={(event) => updateStop({ lane: event.target.value })}
            />
            <TextField
              label="Start pos"
              type="number"
              size="small"
              className="sim-config-field--90"
              value={stop.startPos}
              onChange={(event) =>
                updateStop({
                  startPos: parseNumberInputChange(event.target) || 0,
                })
              }
            />
            <TextField
              label="End pos"
              type="number"
              size="small"
              className="sim-config-field--90"
              value={stop.endPos}
              onChange={(event) =>
                updateStop({
                  endPos: parseNumberInputChange(event.target) || 0,
                })
              }
            />
            <TextField
              label="Duration (s)"
              type="number"
              size="small"
              className="sim-config-field--100"
              value={stop.duration}
              onChange={(event) =>
                updateStop({
                  duration: parseNumberInputChange(event.target) || 0,
                })
              }
            />
          </Stack>
        )}
      </Stack>
    </Box>
  );
}
