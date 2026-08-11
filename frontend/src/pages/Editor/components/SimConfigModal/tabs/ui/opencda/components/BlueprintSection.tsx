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
  createFieldUpdater,
} from '../utils/opencdaFieldUtils';
import { SimulationConfig } from '../../../../../../Generators/types/configGeneratorsTypes';

interface BlueprintSectionProps {
  useMultiClass: boolean;
  bpMetaPath: string;
  classProbabilities: {
    car: number;
    truck: number;
    bus: number;
    bicycle: number;
    motorcycle: number;
  };
  onUpdate: (update: Partial<SimulationConfig['opencda']>) => void;
}

export const BlueprintSection = ({
  useMultiClass,
  bpMetaPath,
  classProbabilities,
  onUpdate,
}: BlueprintSectionProps) => {
  const updateField = createFieldUpdater<SimulationConfig['opencda']>(onUpdate);

  return (
    <Stack spacing={1.5}>
      <Typography variant="subtitle2" color="text.secondary">
        Blueprint
      </Typography>

      <FormControlLabel
        control={
          <Switch
            checked={useMultiClass}
            onChange={(e) =>
              updateField('use_multi_class_bp', e.target.checked)
            }
          />
        }
        label="Multi-class blueprints"
      />

      <TextField
        label="Blueprint meta path"
        size="small"
        fullWidth
        value={bpMetaPath}
        onChange={(e) => updateField('bp_meta_path', e.target.value)}
      />

      <Typography variant="caption" color="text.secondary">
        Class sample probabilities (sum ≤ 1)
      </Typography>

      <Stack direction="row" spacing={1} flexWrap="wrap">
        {(['car', 'truck', 'bus', 'bicycle', 'motorcycle'] as const).map(
          (cls) => (
            <TextField
              key={cls}
              label={cls}
              type="number"
              size="small"
              inputProps={{
                ...numInputSlot.input,
                step: '0.05',
                min: '0',
                max: '1',
              }}
              value={classProbabilities[cls]}
              onChange={(e) => {
                const val = parseNumberFromEvent(e, 0, 1);
                if (val === undefined) return;
                onUpdate({
                  bp_class_sample_prob: {
                    ...classProbabilities,
                    [cls]: val,
                  },
                });
              }}
              sx={{ width: 90 }}
            />
          ),
        )}
      </Stack>
    </Stack>
  );
};
