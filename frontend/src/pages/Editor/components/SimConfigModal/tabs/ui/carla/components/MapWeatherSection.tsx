import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
} from '@mui/material';

import { CarlaConfig } from '../utils/carlaUtils';
import { CarlaWeather } from '@/store/types/useEditorStoreTypes';
import {
  CARLA_MAPS,
  WEATHER_PRESETS,
} from '@sim-config/types/SimConfigModalTypes';

type Props = {
  carla: CarlaConfig;
  selectedMap: string;
  update: (patch: Partial<CarlaConfig>) => void;
};

export const MapWeatherSection = ({ carla, selectedMap, update }: Props) => (
  <Stack direction="row" spacing={2}>
    <FormControl size="small" fullWidth>
      <InputLabel>Map</InputLabel>
      <Select
        value={selectedMap}
        label="Map"
        onChange={(e) => update({ map: e.target.value as string })}
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
        value={carla.weather_preset}
        label="Weather"
        onChange={(e) =>
          update({
            weather_preset: e.target.value as CarlaWeather,
            weather_override: {},
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
);
