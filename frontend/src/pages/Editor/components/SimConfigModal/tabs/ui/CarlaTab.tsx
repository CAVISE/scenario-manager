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
import { CARLA_MAPS, WEATHER_PRESETS } from '../../types/SimConfigModalTypes';
import { CarlaWeather } from '../../../../../../store/types/useEditorStoreTypes';
import { useEditorStore } from '../../../../../../store';
import { useEffect, useMemo } from 'react';
import { getStoredXodrName } from '../../../../hooks/useThreeScene/hooks/useOdrLoader/utils/xodrRepository';

const WEATHER_KEYS = [
  'sun_altitude_angle',
  'cloudiness',
  'precipitation',
  'precipitation_deposits',
  'wind_intensity',
  'fog_density',
  'fog_distance',
  'fog_falloff',
  'wetness',
] as const;
type WeatherKey = (typeof WEATHER_KEYS)[number];

function toCarlaMapNameFromXodr(xodrName: string): string | null {
  const base = xodrName.replace(/\.xodr$/i, '');
  if (!base) return null;
  if (
    base.toLowerCase() === 'town10' ||
    base.toLowerCase() === 'town10hd_opt'
  ) {
    return 'Town10HD';
  }
  const withoutOpt = base.replace(/_Opt$/i, '');
  return CARLA_MAPS.includes(withoutOpt) ? withoutOpt : null;
}

export default function CarlaTab() {
  const simConfig = useEditorStore((s) => s.simConfig);
  const updateSimConfigCarla = useEditorStore((s) => s.updateSimConfigCarla);
  const storedMap = useMemo(
    () => toCarlaMapNameFromXodr(getStoredXodrName(simConfig.carla.map)),
    [simConfig.carla.map],
  );

  useEffect(() => {
    if (storedMap && storedMap !== simConfig.carla.map) {
      updateSimConfigCarla({ map: storedMap });
    }
  }, [simConfig.carla.map, storedMap, updateSimConfigCarla]);

  const selectedMap = CARLA_MAPS.includes(simConfig.carla.map)
    ? simConfig.carla.map
    : storedMap || 'Town03';
  const customWeatherEnabled =
    Object.keys(simConfig.carla.weather_override ?? {}).length > 0;

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={2}>
        <FormControl size="small" fullWidth>
          <InputLabel>Map</InputLabel>
          <Select
            value={selectedMap}
            label="Map"
            onChange={(e) =>
              updateSimConfigCarla({ map: e.target.value as string })
            }
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
          label="Client Port"
          type="number"
          size="small"
          fullWidth
          value={simConfig.carla.client_port}
          onChange={(e) =>
            updateSimConfigCarla({ client_port: Number(e.target.value) })
          }
        />
        <TextField
          label="Seed"
          type="number"
          size="small"
          fullWidth
          value={simConfig.carla.seed}
          onChange={(e) => updateSimConfigCarla({ seed: Number(e.target.value) })}
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
        OpenCDA Weather
      </Typography>
      <FormControlLabel
        control={
          <Switch
            checked={customWeatherEnabled}
            onChange={(e) =>
              updateSimConfigCarla({
                weather_override: e.target.checked ? {} : undefined,
              })
            }
          />
        }
        label="Custom world.weather override"
      />
      {customWeatherEnabled && (
        <Box
          display="grid"
          gridTemplateColumns="repeat(2, minmax(0, 1fr))"
          gap={1.5}
        >
          {WEATHER_KEYS.map((key) => (
            <TextField
              key={key}
              label={key}
              type="number"
              size="small"
              value={simConfig.carla.weather_override?.[key] ?? ''}
              onChange={(e) => {
                const raw = e.target.value.trim();
                const next = { ...(simConfig.carla.weather_override ?? {}) };
                if (raw === '') {
                  delete next[key];
                } else {
                  next[key as WeatherKey] = Number(raw);
                }
                updateSimConfigCarla({ weather_override: next });
              }}
            />
          ))}
        </Box>
      )}

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
