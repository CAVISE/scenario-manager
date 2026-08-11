import {
  Divider,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { parseNumberInputChange } from '../../../../../../shared/utils/numberInput';
import { CarlaConfig, SENSORS } from '../utils/carlaUtils';

type Props = {
  carla: CarlaConfig;
  update: (patch: Partial<CarlaConfig>) => void;
};

export const SensorsSection = ({ carla, update }: Props) => (
  <>
    <Divider />
    <Typography variant="subtitle2" color="text.secondary">
      Sensors
    </Typography>
    <Stack direction="row" flexWrap="wrap" gap={1}>
      {SENSORS.map((s) => (
        <FormControlLabel
          key={s}
          control={
            <Switch
              checked={carla.sensors[s]}
              onChange={(e) =>
                update({
                  sensors: {
                    ...carla.sensors,
                    [s]: e.target.checked,
                  },
                })
              }
            />
          }
          label={s.toUpperCase()}
        />
      ))}
    </Stack>
    {carla.sensors.lidar && (
      <Stack direction="row" spacing={2}>
        <TextField
          label="LiDAR Channels"
          type="number"
          size="small"
          fullWidth
          value={carla.lidar_channels}
          onChange={(e) =>
            update({ lidar_channels: parseNumberInputChange(e.target) })
          }
        />
        <TextField
          label="LiDAR Range (m)"
          type="number"
          size="small"
          fullWidth
          value={carla.lidar_range}
          onChange={(e) =>
            update({ lidar_range: parseNumberInputChange(e.target) })
          }
        />
      </Stack>
    )}
    {carla.sensors.camera && (
      <TextField
        label="Camera FOV (°)"
        type="number"
        size="small"
        value={carla.camera_fov}
        onChange={(e) =>
          update({ camera_fov: parseNumberInputChange(e.target) })
        }
        sx={{ width: '48%' }}
      />
    )}
  </>
);
