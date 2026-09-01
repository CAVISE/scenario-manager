import {
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  numInputSlot,
  createNumberFieldOnChange,
} from '../utils/opencdaFieldUtils';
import { SimulationConfig } from '@/store';

interface VehicleBehaviorSectionProps {
  maxSpeed: number;
  tailgateSpeed: number;
  safetyTime: number;
  emergencyParam: number;
  collisionTimeAhead: number;
  sampleResolution: number;
  speedLimDist: number;
  speedDecrease: number;
  overtakeCounterRecover: number;
  ignoreTrafficLight: boolean;
  overtakeAllowed: boolean;
  staticObstacleAvoidanceEnabled: boolean;
  onUpdate: (update: Partial<SimulationConfig['opencda']>) => void;
}

export const VehicleBehaviorSection = ({
  maxSpeed,
  tailgateSpeed,
  safetyTime,
  emergencyParam,
  collisionTimeAhead,
  sampleResolution,
  speedLimDist,
  speedDecrease,
  overtakeCounterRecover,
  ignoreTrafficLight,
  overtakeAllowed,
  staticObstacleAvoidanceEnabled,
  onUpdate,
}: VehicleBehaviorSectionProps) => {
  const updateField = (
    field: keyof SimulationConfig['opencda'],
    value: SimulationConfig['opencda'][keyof SimulationConfig['opencda']]
  ) => {
    onUpdate({ [field]: value } as Partial<SimulationConfig['opencda']>);
  };

  const numberField = (
    field: keyof SimulationConfig['opencda'],
    min?: number,
    max?: number
  ) => createNumberFieldOnChange((val) => updateField(field, val), min, max);

  return (
    <Stack spacing={1.5}>
      <Typography variant="subtitle2" color="text.secondary">
        Vehicle behavior
      </Typography>

      <Stack direction="row" spacing={2}>
        <TextField
          label="Max speed (km/h)"
          type="number"
          size="small"
          fullWidth
          inputProps={{ ...numInputSlot.input, min: 0, max: 300 }}
          value={maxSpeed}
          onChange={numberField('max_speed', 0, 300)}
        />
        <TextField
          label="Tailgate speed"
          type="number"
          size="small"
          fullWidth
          inputProps={{ ...numInputSlot.input, min: 0 }}
          value={tailgateSpeed}
          onChange={numberField('tailgate_speed', 0)}
        />
      </Stack>

      <Stack direction="row" spacing={2}>
        <TextField
          label="Safety time (s)"
          type="number"
          size="small"
          fullWidth
          inputProps={{ ...numInputSlot.input, min: 0, step: 0.1 }}
          value={safetyTime}
          onChange={numberField('safety_time', 0)}
        />
        <TextField
          label="Emergency param"
          type="number"
          size="small"
          fullWidth
          inputProps={{ ...numInputSlot.input, min: 0, step: '0.05' }}
          value={emergencyParam}
          onChange={numberField('emergency_param', 0)}
        />
      </Stack>

      <Stack direction="row" spacing={2}>
        <TextField
          label="Collision ahead (s)"
          type="number"
          size="small"
          fullWidth
          inputProps={{ ...numInputSlot.input, min: 0 }}
          value={collisionTimeAhead}
          onChange={numberField('collision_time_ahead', 0)}
        />
        <TextField
          label="Sample resolution (m)"
          type="number"
          size="small"
          fullWidth
          inputProps={{ ...numInputSlot.input, min: 0.1, step: 0.1 }}
          value={sampleResolution}
          onChange={numberField('sample_resolution', 0.1)}
        />
      </Stack>

      <Stack direction="row" spacing={2}>
        <TextField
          label="Speed lim dist (m)"
          type="number"
          size="small"
          fullWidth
          inputProps={{ ...numInputSlot.input, min: 0 }}
          value={speedLimDist}
          onChange={numberField('speed_lim_dist', 0)}
        />
        <TextField
          label="Speed decrease"
          type="number"
          size="small"
          fullWidth
          inputProps={{ ...numInputSlot.input, min: 0 }}
          value={speedDecrease}
          onChange={numberField('speed_decrease', 0)}
        />
      </Stack>

      <TextField
        label="Overtake counter recover"
        type="number"
        size="small"
        fullWidth
        inputProps={{ ...numInputSlot.input, min: 0 }}
        value={overtakeCounterRecover}
        onChange={numberField('overtake_counter_recover', 0)}
      />

      <Stack direction="row" gap={1} flexWrap="wrap">
        <FormControlLabel
          control={
            <Switch
              checked={ignoreTrafficLight}
              onChange={(e) =>
                updateField('ignore_traffic_light', e.target.checked)
              }
            />
          }
          label="Ignore traffic lights"
        />
        <FormControlLabel
          control={
            <Switch
              checked={overtakeAllowed}
              onChange={(e) =>
                updateField('overtake_allowed', e.target.checked)
              }
            />
          }
          label="Overtake allowed"
        />
        <Tooltip
          title="Checks planned paths against nearby traffic-light poles using
            each pole's actor origin with a fixed collision radius, not its
            real bounding box -- this can flag a hazard from a pole that
            isn't actually blocking the path, so it's off by default."
        >
          <FormControlLabel
            control={
              <Switch
                checked={staticObstacleAvoidanceEnabled}
                onChange={(e) =>
                  updateField(
                    'static_obstacle_avoidance_enabled',
                    e.target.checked
                  )
                }
              />
            }
            label="Avoid traffic-light poles"
          />
        </Tooltip>
      </Stack>
    </Stack>
  );
};
