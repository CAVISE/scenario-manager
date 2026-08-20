import {
  Chip,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  numInputSlot,
  formatValue,
  getChipColor,
  createNestedUpdate,
  createNumberFieldOnChange,
  parseNumberFromEvent,
} from '../utils/opencdaFieldUtils';
import { SimulationConfig } from '@/store';

interface BackgroundTrafficSectionProps {
  enabled: boolean;
  random: boolean;
  spawnRange: {
    x_min: number;
    x_max: number;
    y_min: number;
    y_max: number;
    x_step: number;
    y_step: number;
  };
  globalSpeedPerc: number;
  vehicleNum: number;
  globalDistance: number;
  osmMode: boolean;
  ignoreLightsPerc: number;
  ignoreSignsPerc: number;
  ignoreWalkersPerc: number;
  autoLaneChange: boolean;
  onUpdate: (update: Partial<SimulationConfig['opencda']>) => void;
}

export const BackgroundTrafficSection = ({
  enabled,
  random,
  spawnRange,
  globalSpeedPerc,
  vehicleNum,
  globalDistance,
  osmMode,
  ignoreLightsPerc,
  ignoreSignsPerc,
  ignoreWalkersPerc,
  autoLaneChange,
  onUpdate,
}: BackgroundTrafficSectionProps) => {
  const updateField = <K extends keyof SimulationConfig['opencda']>(
    field: K,
    value: Partial<SimulationConfig['opencda'][K]>
  ) => {
    onUpdate({ [field]: value } as Partial<SimulationConfig['opencda']>);
  };

  const handleSpawnRangeChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    field: keyof typeof spawnRange
  ) => {
    const val = parseNumberFromEvent(e);
    if (val !== undefined) {
      const stringSpawnRange = Object.fromEntries(
        Object.entries(spawnRange).map(([key, value]) => [key, String(value)])
      ) as Record<string, string>;

      onUpdate(
        createNestedUpdate('bg_spawn_range', stringSpawnRange, {
          [field]: String(val),
        })
      );
    }
  };

  const createNumberField = <K extends keyof SimulationConfig['opencda']>(
    label: string,
    field: K,
    value: number,
    options?: {
      min?: number;
      max?: number;
      step?: number;
      tooltip?: string;
      chip?: boolean;
      chipFormatter?: (val: number) => string;
      formatType?: 'percent' | 'speed' | 'distance' | 'default';
    }
  ) => {
    const formatType = options?.formatType || 'default';
    const formattedValue = options?.chipFormatter
      ? options.chipFormatter(value)
      : formatValue(value, formatType);

    return (
      <Tooltip title={options?.tooltip || ''} arrow placement="top">
        <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1 }}>
          <TextField
            label={label}
            type="number"
            size="small"
            fullWidth
            inputProps={{
              ...numInputSlot.input,
              min: options?.min,
              max: options?.max,
              step: options?.step || 1,
            }}
            value={value}
            onChange={createNumberFieldOnChange(
              (val) =>
                onUpdate({ [field]: val } as Partial<
                  SimulationConfig['opencda']
                >),
              options?.min,
              options?.max
            )}
          />
          {options?.chip && (
            <Chip
              label={formattedValue}
              size="small"
              color={getChipColor(value, options?.min, options?.max)}
              sx={{ minWidth: 50 }}
            />
          )}
        </Stack>
      </Tooltip>
    );
  };

  const createSpawnRangeField = (
    label: string,
    field: keyof typeof spawnRange,
    value: number
  ) => (
    <TextField
      label={label}
      type="number"
      size="small"
      fullWidth
      inputProps={numInputSlot.input}
      value={value}
      onChange={(e) => handleSpawnRangeChange(e, field)}
    />
  );

  const isSpawnRangeValid =
    spawnRange.x_min < spawnRange.x_max &&
    spawnRange.y_min < spawnRange.y_max &&
    spawnRange.x_step > 0 &&
    spawnRange.y_step > 0;

  return (
    <Stack spacing={1.5}>
      <Typography variant="subtitle2" color="text.secondary">
        Background CARLA traffic
      </Typography>

      <FormControlLabel
        control={
          <Switch
            checked={enabled}
            onChange={(e) =>
              updateField('enable_background_traffic', e.target.checked)
            }
          />
        }
        label={
          <Stack direction="row" alignItems="center" spacing={1}>
            <span>Enable background traffic</span>
            <Chip
              label={enabled ? 'Active' : 'Disabled'}
              size="small"
              color={enabled ? 'success' : 'default'}
            />
          </Stack>
        }
      />

      {enabled && (
        <Stack spacing={2}>
          <Typography variant="caption" color="text.secondary">
            Spawn settings
          </Typography>

          <FormControlLabel
            control={
              <Switch
                checked={random}
                onChange={(e) =>
                  updateField('bg_traffic_random', e.target.checked)
                }
              />
            }
            label={
              <Stack direction="row" alignItems="center" spacing={1}>
                <span>Random spawn</span>
                <Chip
                  label={random ? 'On' : 'Off'}
                  size="small"
                  color={random ? 'warning' : 'default'}
                />
              </Stack>
            }
          />

          <Typography variant="caption" color="text.secondary">
            Spawn range [x_min, x_max, y_min, y_max, x_step, y_step]
          </Typography>

          {!isSpawnRangeValid && (
            <Typography variant="caption" color="error">
              ⚠️ Invalid spawn range: ensure x_min &lt; x_max, y_min &lt; y_max,
              and steps &gt; 0
            </Typography>
          )}

          <Stack direction="row" spacing={2}>
            {createSpawnRangeField('X min', 'x_min', spawnRange.x_min)}
            {createSpawnRangeField('X max', 'x_max', spawnRange.x_max)}
          </Stack>

          <Stack direction="row" spacing={2}>
            {createSpawnRangeField('Y min', 'y_min', spawnRange.y_min)}
            {createSpawnRangeField('Y max', 'y_max', spawnRange.y_max)}
          </Stack>

          <Stack direction="row" spacing={2}>
            {createSpawnRangeField('X step', 'x_step', spawnRange.x_step)}
            {createSpawnRangeField('Y step', 'y_step', spawnRange.y_step)}
          </Stack>

          <Typography variant="caption" color="text.secondary" sx={{ pt: 1 }}>
            Traffic parameters
          </Typography>

          <Stack direction="row" spacing={2}>
            {createNumberField(
              'Speed % (−100=2x)',
              'global_speed_perc',
              globalSpeedPerc,
              {
                min: -100,
                tooltip: 'Speed percentage (-100 = 2x speed)',
                chip: true,
                formatType: 'speed',
              }
            )}
            {createNumberField('Vehicles', 'bg_vehicle_num', vehicleNum, {
              min: 0,
              tooltip: 'Number of background vehicles',
              chip: true,
            })}
          </Stack>

          <Stack direction="row" spacing={2}>
            {createNumberField(
              'Global distance (m)',
              'bg_global_distance',
              globalDistance,
              {
                min: 0,
                tooltip: 'Global distance for traffic flow',
                chip: true,
                formatType: 'distance',
              }
            )}
            <FormControlLabel
              control={
                <Switch
                  checked={osmMode}
                  onChange={(e) =>
                    updateField('bg_set_osm_mode', e.target.checked)
                  }
                />
              }
              label={
                <Stack direction="row" alignItems="center" spacing={1}>
                  <span>OSM mode</span>
                  <Chip
                    label={osmMode ? 'On' : 'Off'}
                    size="small"
                    color={osmMode ? 'info' : 'default'}
                  />
                </Stack>
              }
            />
          </Stack>

          <Typography variant="caption" color="text.secondary" sx={{ pt: 1 }}>
            Behavior
          </Typography>

          <Stack direction="row" spacing={2}>
            {createNumberField(
              'Ignore lights %',
              'ignore_lights_percentage',
              ignoreLightsPerc,
              {
                min: 0,
                max: 100,
                tooltip: 'Percentage of vehicles ignoring traffic lights',
                chip: true,
                formatType: 'percent',
              }
            )}
            {createNumberField(
              'Ignore signs %',
              'bg_ignore_signs_percentage',
              ignoreSignsPerc,
              {
                min: 0,
                max: 100,
                tooltip: 'Percentage of vehicles ignoring traffic signs',
                chip: true,
                formatType: 'percent',
              }
            )}
          </Stack>

          <Stack direction="row" spacing={2} alignItems="center">
            {createNumberField(
              'Ignore walkers %',
              'bg_ignore_walkers_percentage',
              ignoreWalkersPerc,
              {
                min: 0,
                max: 100,
                tooltip: 'Percentage of vehicles ignoring pedestrians',
                chip: true,
                formatType: 'percent',
              }
            )}
            <FormControlLabel
              control={
                <Switch
                  checked={autoLaneChange}
                  onChange={(e) =>
                    updateField('auto_lane_change', e.target.checked)
                  }
                />
              }
              label={
                <Stack direction="row" alignItems="center" spacing={1}>
                  <span>Auto lane change</span>
                  <Chip
                    label={autoLaneChange ? 'On' : 'Off'}
                    size="small"
                    color={autoLaneChange ? 'primary' : 'default'}
                  />
                </Stack>
              }
            />
          </Stack>

          <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
            Background traffic: {vehicleNum} vehicles • Random:{' '}
            {random ? '✅' : '❌'} • OSM: {osmMode ? '✅' : '❌'} • Auto lane:{' '}
            {autoLaneChange ? '✅' : '❌'} • Speed:{' '}
            {globalSpeedPerc === -100 ? '2x' : `${globalSpeedPerc}%`}
          </Typography>
        </Stack>
      )}
    </Stack>
  );
};
