import {
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
import { CARLA_MAPS, WEATHER_PRESETS } from '../../types/SimConfigModalTypes';
import { CarlaWeather } from '../../../../../../store/types/useEditorStoreTypes';
import { useEditorStore } from '../../../../../../store';

export default function CarlaTab() {
  const simConfig = useEditorStore((s) => s.simConfig);
  const updateSimConfigCarla = useEditorStore((s) => s.updateSimConfigCarla);
  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={2}>
        <FormControl size="small" fullWidth>
          <InputLabel>Map</InputLabel>
          <Select
            value={simConfig.carla.map}
            label="Map"
            onChange={(e) => updateSimConfigCarla({ map: e.target.value })}
          >
            {CARLA_MAPS.map((m) => (
              <MenuItem key={m} value={m}>
                {m}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" fullWidth>
          <InputLabel>Weather</InputLabel>
          <Select
            value={simConfig.carla.weather_preset}
            label="Weather"
            onChange={(e) =>
              updateSimConfigCarla({
                weather_preset: e.target.value as CarlaWeather,
              })
            }
          >
            {WEATHER_PRESETS.map((w) => (
              <MenuItem key={w} value={w}>
                {w}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>
      <Stack direction="row" spacing={2}>
        <TextField
          label="Vehicles"
          type="number"
          size="small"
          fullWidth
          value={simConfig.carla.num_vehicles}
          onChange={(e) =>
            updateSimConfigCarla({ num_vehicles: Number(e.target.value) })
          }
        />
        <TextField
          label="Pedestrians"
          type="number"
          size="small"
          fullWidth
          value={simConfig.carla.num_pedestrians}
          onChange={(e) =>
            updateSimConfigCarla({ num_pedestrians: Number(e.target.value) })
          }
        />
      </Stack>
      <Stack direction="row" spacing={2}>
        <TextField
          label="Fixed Delta (s)"
          type="number"
          size="small"
          fullWidth
          inputProps={{ step: 0.01 }}
          value={simConfig.carla.fixed_delta_seconds}
          onChange={(e) =>
            updateSimConfigCarla({
              fixed_delta_seconds: Number(e.target.value),
            })
          }
        />
        <TextField
          label="TM Port"
          type="number"
          size="small"
          fullWidth
          value={simConfig.carla.traffic_manager_port}
          onChange={(e) =>
            updateSimConfigCarla({
              traffic_manager_port: Number(e.target.value),
            })
          }
        />
      </Stack>
      <FormControlLabel
        control={
          <Switch
            checked={simConfig.carla.synchronous_mode}
            onChange={(e) =>
              updateSimConfigCarla({ synchronous_mode: e.target.checked })
            }
          />
        }
        label="Synchronous Mode"
      />
      <Divider />
      <Typography variant="subtitle2" color="text.secondary">
        Sensors
      </Typography>
      <Stack direction="row" flexWrap="wrap" gap={1}>
        {(['camera', 'lidar', 'radar', 'gnss', 'imu'] as const).map((s) => (
          <FormControlLabel
            key={s}
            control={
              <Switch
                checked={simConfig.carla.sensors[s]}
                onChange={(e) =>
                  updateSimConfigCarla({
                    sensors: {
                      ...simConfig.carla.sensors,
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
      {simConfig.carla.sensors.lidar && (
        <Stack direction="row" spacing={2}>
          <TextField
            label="LiDAR Channels"
            type="number"
            size="small"
            fullWidth
            value={simConfig.carla.lidar_channels}
            onChange={(e) =>
              updateSimConfigCarla({ lidar_channels: Number(e.target.value) })
            }
          />
          <TextField
            label="LiDAR Range (m)"
            type="number"
            size="small"
            fullWidth
            value={simConfig.carla.lidar_range}
            onChange={(e) =>
              updateSimConfigCarla({ lidar_range: Number(e.target.value) })
            }
          />
        </Stack>
      )}
      {simConfig.carla.sensors.camera && (
        <TextField
          label="Camera FOV (°)"
          type="number"
          size="small"
          value={simConfig.carla.camera_fov}
          onChange={(e) =>
            updateSimConfigCarla({ camera_fov: Number(e.target.value) })
          }
          sx={{ width: '48%' }}
        />
      )}
    </Stack>
  );
}
