import {
  Chip,
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
import { SimulationConfig } from '@/store';

interface V2XSectionProps {
  enabled: boolean;
  range: number;
  positionSource: 'estimated' | 'ground_truth';
  onUpdate: (update: Partial<SimulationConfig['opencda']>) => void;
}

export const V2XSection = ({
  enabled,
  range,
  positionSource,
  onUpdate,
}: V2XSectionProps) => {
  const updateField = (
    field: keyof SimulationConfig['opencda'],
    value: SimulationConfig['opencda'][keyof SimulationConfig['opencda']],
  ) => {
    onUpdate({ [field]: value } as Partial<SimulationConfig['opencda']>);
  };

  const handleRangeChange = createNumberFieldOnChange(
    (val) => updateField('v2x_communication_range', val),
    0,
    1000,
  );

  const isRangeLarge = range > 500;

  return (
    <Stack spacing={1.5}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Typography variant="subtitle2" color="text.secondary">
          Export / defaults
        </Typography>
        <Chip
          label={enabled ? 'V2X Active' : 'V2X Disabled'}
          color={enabled ? 'success' : 'default'}
          size="small"
        />
      </Stack>

      <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
        <FormControlLabel
          control={
            <Switch
              checked={enabled}
              onChange={(e) => updateField('v2x_enabled', e.target.checked)}
            />
          }
          label="Default V2X enabled"
        />

        <TextField
          label="V2X range (m)"
          type="number"
          size="small"
          inputProps={{
            ...numInputSlot.input,
            min: 0,
            max: 1000,
            step: 1,
          }}
          value={range}
          onChange={handleRangeChange}
          sx={{ maxWidth: 140 }}
          helperText={
            isRangeLarge ? '⚠️ Large range may impact performance' : ''
          }
          FormHelperTextProps={{
            sx: { color: isRangeLarge ? 'warning.main' : 'text.secondary' },
          }}
        />

        <FormControl size="small" sx={{ minWidth: 190 }}>
          <FormLabel>V2X position source</FormLabel>
          <Select
            value={positionSource}
            onChange={(e) =>
              updateField(
                'v2x_position_source',
                e.target.value as 'estimated' | 'ground_truth',
              )
            }
          >
            <MenuItem value="estimated">Estimated</MenuItem>
            <MenuItem value="ground_truth">Ground truth</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      <Typography variant="caption" color="text.secondary">
        Vehicle-to-Everything (V2X) communication enables cooperative awareness
        between vehicles and infrastructure
      </Typography>
    </Stack>
  );
};
