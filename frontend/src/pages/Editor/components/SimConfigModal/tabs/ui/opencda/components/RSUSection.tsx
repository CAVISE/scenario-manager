import {
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import {
  numInputSlot,
  createNumberFieldOnChange,
  createFieldUpdater,
} from '../utils/opencdaFieldUtils';
import { SimulationConfig } from '../../../../../../Generators/types/configGeneratorsTypes';

export type RSUFields = Pick<
  SimulationConfig['opencda'],
  | 'rsu_lidar_channels'
  | 'rsu_lidar_range'
  | 'rsu_camera_visualize'
  | 'rsu_cam_num'
  | 'rsu_perception_activate'
>;

interface RSUSectionProps extends RSUFields {
  onUpdate: (update: Partial<RSUFields>) => void;
}

export const RSUSection = ({
  rsu_lidar_channels,
  rsu_lidar_range,
  rsu_camera_visualize,
  rsu_cam_num,
  rsu_perception_activate,
  onUpdate,
}: RSUSectionProps) => {
  const updateField = createFieldUpdater<SimulationConfig['opencda']>(onUpdate);

  const numberField = <K extends keyof RSUFields & string>(
    field: K,
    min?: number,
    max?: number,
  ) =>
    createNumberFieldOnChange(
      (val) => updateField(field, val as SimulationConfig['opencda'][K]),
      min,
      max,
    );

  return (
    <Stack spacing={1.5}>
      <Typography variant="subtitle2" color="text.secondary">
        RSU base
      </Typography>

      <Stack direction="row" spacing={2}>
        <TextField
          label="LiDAR channels"
          type="number"
          size="small"
          fullWidth
          inputProps={{ ...numInputSlot.input, min: 1, max: 128 }}
          value={rsu_lidar_channels}
          onChange={numberField('rsu_lidar_channels', 1, 128)}
        />
        <TextField
          label="LiDAR range (m)"
          type="number"
          size="small"
          fullWidth
          inputProps={{ ...numInputSlot.input, min: 1, max: 500 }}
          value={rsu_lidar_range}
          onChange={numberField('rsu_lidar_range', 1, 500)}
        />
      </Stack>

      <Stack direction="row" spacing={2}>
        <TextField
          label="RSU cam visualize (0/1)"
          type="number"
          size="small"
          fullWidth
          inputProps={{ ...numInputSlot.input, min: 0, max: 1 }}
          value={rsu_camera_visualize}
          onChange={numberField('rsu_camera_visualize', 0, 1)}
        />
        <TextField
          label="Camera count (0–4)"
          type="number"
          size="small"
          fullWidth
          inputProps={{ ...numInputSlot.input, min: 0, max: 4 }}
          value={rsu_cam_num}
          onChange={numberField('rsu_cam_num', 0, 4)}
        />
      </Stack>

      <FormControlLabel
        control={
          <Switch
            checked={rsu_perception_activate}
            onChange={(e) =>
              updateField('rsu_perception_activate', e.target.checked)
            }
          />
        }
        label="RSU Perception"
      />
    </Stack>
  );
};
