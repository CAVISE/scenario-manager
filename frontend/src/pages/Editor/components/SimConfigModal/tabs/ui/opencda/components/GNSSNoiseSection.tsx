import {
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import {
  numInputSlot,
  parseNumberFromEvent,
  createNestedUpdate,
} from '../utils/opencdaFieldUtils';
import { SimulationConfig } from '../../../../../../Generators/types/configGeneratorsTypes';

interface GNSSNoiseSectionProps {
  altStddev: number;
  latStddev: number;
  lonStddev: number;
  debugAnimation: boolean;
  onUpdate: (update: Partial<SimulationConfig['opencda']>) => void;
}

export const GNSSNoiseSection = ({
  altStddev,
  latStddev,
  lonStddev,
  debugAnimation,
  onUpdate,
}: GNSSNoiseSectionProps) => {
  const updateField = (
    field: keyof SimulationConfig['opencda'],
    value: SimulationConfig['opencda'][keyof SimulationConfig['opencda']],
  ) => {
    onUpdate({ [field]: value } as Partial<SimulationConfig['opencda']>);
  };

  const handleNumberChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    field: string,
    min?: number,
    max?: number,
  ) => {
    const val = parseNumberFromEvent(e, min, max);
    if (val === undefined) return;
    onUpdate(
      createNestedUpdate(
        'gnss_noise',
        {
          alt_stddev: altStddev,
          lat_stddev: latStddev,
          lon_stddev: lonStddev,
        },
        { [field]: val },
      ),
    );
  };

  return (
    <Stack spacing={1.5}>
      <Typography variant="subtitle2" color="text.secondary">
        Vehicle sensing
      </Typography>

      <Typography variant="subtitle2" color="text.secondary" sx={{ pt: 1 }}>
        Localization
      </Typography>

      <Typography variant="caption" color="text.secondary">
        GNSS noise (RSU block, when localization on)
      </Typography>

      <Stack direction="row" spacing={2}>
        <TextField
          label="Alt σ"
          type="number"
          size="small"
          fullWidth
          inputProps={{ ...numInputSlot.input, step: 0.01, min: 0 }}
          value={altStddev}
          onChange={(e) => handleNumberChange(e, 'alt_stddev', 0)}
        />
        <TextField
          label="Lat σ"
          type="number"
          size="small"
          fullWidth
          inputProps={{ ...numInputSlot.input, step: 1e-7, min: 0 }}
          value={latStddev}
          onChange={(e) => handleNumberChange(e, 'lat_stddev', 0)}
        />
        <TextField
          label="Lon σ"
          type="number"
          size="small"
          fullWidth
          inputProps={{ ...numInputSlot.input, step: 1e-7, min: 0 }}
          value={lonStddev}
          onChange={(e) => handleNumberChange(e, 'lon_stddev', 0)}
        />
      </Stack>

      <FormControlLabel
        control={
          <Switch
            checked={debugAnimation}
            onChange={(e) =>
              updateField(
                'vehicle_localization_debug_animation',
                e.target.checked,
              )
            }
          />
        }
        label="Vehicle localization debug animation"
      />
    </Stack>
  );
};
