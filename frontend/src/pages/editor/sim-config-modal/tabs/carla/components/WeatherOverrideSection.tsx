import {
  Box,
  Divider,
  FormControlLabel,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { weatherParamsFromPreset } from '../../../../generators/exporters/opencdaWeather';
import { CARLA_WEATHER_KEYS } from '../carla.constants';
import type {
  CarlaWeatherKey,
  CarlaWeatherOverrideSectionProps,
} from '../carla.types';

export const WeatherOverrideSection = ({
  carla,
  customWeatherEnabled,
  update,
}: CarlaWeatherOverrideSectionProps) => (
  <>
    <Divider />
    <Typography variant="subtitle2" color="text.secondary">
      OpenCDA Weather
    </Typography>
    <FormControlLabel
      control={
        <Switch
          checked={customWeatherEnabled}
          onChange={(e) =>
            update({
              weather_override: e.target.checked
                ? weatherParamsFromPreset(carla.weather_preset)
                : {},
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
        {CARLA_WEATHER_KEYS.map((key) => (
          <TextField
            key={key}
            label={key}
            type="number"
            size="small"
            value={carla.weather_override?.[key] ?? ''}
            onChange={(e) => {
              const raw = e.target.value.trim();
              const next = { ...(carla.weather_override ?? {}) };
              if (raw === '') {
                delete next[key];
              } else {
                next[key as CarlaWeatherKey] = Number(raw);
              }
              update({ weather_override: next });
            }}
          />
        ))}
      </Box>
    )}
  </>
);
