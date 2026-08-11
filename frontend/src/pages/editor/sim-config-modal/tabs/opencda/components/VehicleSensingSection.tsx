import {
  FormControl,
  FormControlLabel,
  FormLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import {
  numInputSlot,
  createNumberFieldOnChange,
} from '../utils/opencdaFieldUtils';
import { SimulationConfig } from '../../../../generators/generators.types';
import type { VehicleSensingSectionProps } from '../opencda.types';

export const VehicleSensingSection = ({
  cameraVisualize,
  camNum,
  lidarChannels,
  lidarRange,
  lidarPointsPerSecond,
  lidarRotationFrequency,
  lidarUpperFov,
  lidarLowerFov,
  perceptionActivate,
  localizationActivate,
  localizationSource,
  lidarVisualize,
  onUpdate,
}: VehicleSensingSectionProps) => {
  const updateField = (
    field: keyof SimulationConfig['opencda'],
    value: SimulationConfig['opencda'][keyof SimulationConfig['opencda']],
  ) => {
    onUpdate({ [field]: value } as Partial<SimulationConfig['opencda']>);
  };

  const numberField = (
    field: keyof SimulationConfig['opencda'],
    min?: number,
    max?: number,
  ) => createNumberFieldOnChange((val) => updateField(field, val), min, max);

  return (
    <Stack spacing={1.5}>
      <Typography variant="subtitle2" color="text.secondary">
        Vehicle sensing
      </Typography>

      <Stack direction="row" spacing={2}>
        <TextField
          label="Cam visualize (0/1)"
          type="number"
          size="small"
          fullWidth
          inputProps={{ ...numInputSlot.input, min: 0, max: 1 }}
          value={cameraVisualize}
          onChange={numberField('vehicle_camera_visualize', 0, 1)}
        />
        <TextField
          label="Onboard cameras (0–4)"
          type="number"
          size="small"
          fullWidth
          inputProps={{ ...numInputSlot.input, min: 0, max: 4 }}
          value={camNum}
          onChange={numberField('vehicle_cam_num', 0, 4)}
        />
      </Stack>

      <Typography variant="subtitle2" color="text.secondary" sx={{ pt: 1 }}>
        Vehicle LiDAR
      </Typography>
      <Stack direction="row" spacing={2}>
        <TextField
          label="Channels"
          type="number"
          size="small"
          fullWidth
          inputProps={{ ...numInputSlot.input, min: 1, max: 128 }}
          value={lidarChannels}
          onChange={numberField('lidar_channels', 1, 128)}
        />
        <TextField
          label="Range (m)"
          type="number"
          size="small"
          fullWidth
          inputProps={{ ...numInputSlot.input, min: 1, max: 500 }}
          value={lidarRange}
          onChange={numberField('lidar_range', 1, 500)}
        />
      </Stack>
      <Stack direction="row" spacing={2}>
        <TextField
          label="Points / second"
          type="number"
          size="small"
          fullWidth
          inputProps={{ ...numInputSlot.input, min: 1000, max: 10000000 }}
          value={lidarPointsPerSecond}
          onChange={numberField('lidar_points_per_second', 1000, 10000000)}
        />
        <TextField
          label="Rotation freq (Hz)"
          type="number"
          size="small"
          fullWidth
          inputProps={{ ...numInputSlot.input, min: 1, max: 100, step: 0.1 }}
          value={lidarRotationFrequency}
          onChange={numberField('lidar_rotation_frequency', 1, 100)}
        />
      </Stack>
      <Stack direction="row" spacing={2}>
        <TextField
          label="Upper FOV (°)"
          type="number"
          size="small"
          fullWidth
          inputProps={{ ...numInputSlot.input, min: -90, max: 90 }}
          value={lidarUpperFov}
          onChange={numberField('lidar_upper_fov', -90, 90)}
        />
        <TextField
          label="Lower FOV (°)"
          type="number"
          size="small"
          fullWidth
          inputProps={{ ...numInputSlot.input, min: -90, max: 90 }}
          value={lidarLowerFov}
          onChange={numberField('lidar_lower_fov', -90, 90)}
        />
      </Stack>

      <Stack direction="row" gap={1} flexWrap="wrap" sx={{ pt: 1 }}>
        <FormControlLabel
          control={
            <Switch
              checked={perceptionActivate}
              onChange={(e) =>
                updateField('perception_activate', e.target.checked)
              }
            />
          }
          label="Perception"
        />
        <FormControlLabel
          control={
            <Switch
              checked={localizationActivate}
              onChange={(e) =>
                updateField('localization_activate', e.target.checked)
              }
            />
          }
          label="Localization"
        />
        <FormControl size="small" sx={{ minWidth: 190 }}>
          <FormLabel>Navigation position</FormLabel>
          <Select
            value={localizationSource}
            onChange={(e) =>
              updateField(
                'localization_navigation_source',
                e.target.value as 'estimated' | 'ground_truth',
              )
            }
          >
            <MenuItem value="estimated">Estimated</MenuItem>
            <MenuItem value="ground_truth">Ground truth</MenuItem>
          </Select>
        </FormControl>
        <FormControlLabel
          control={
            <Switch
              checked={lidarVisualize}
              onChange={(e) => updateField('lidar_visualize', e.target.checked)}
            />
          }
          label="Visualize LiDAR"
        />
      </Stack>
    </Stack>
  );
};
