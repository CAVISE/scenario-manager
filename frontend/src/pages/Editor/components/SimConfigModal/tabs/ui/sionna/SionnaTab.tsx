import { useEditorStore } from '@/store';
import { FormControlLabel, Stack, Switch, TextField } from '@mui/material';
import { parseNumberInputChange } from '../../../utils/numberInputUtils';

export default function SionnaTab() {
  const simConfig = useEditorStore((s) => s.simConfig);
  const updateSimConfigSionna = useEditorStore((s) => s.updateSimConfigSionna);
  return (
    <Stack spacing={2}>
      <TextField
        label="Carrier Frequency (Hz)"
        type="number"
        size="small"
        fullWidth
        value={simConfig.sionna.carrier_frequency}
        onChange={(e) =>
          updateSimConfigSionna({
            carrier_frequency: parseNumberInputChange(e.target),
          })
        }
      />
      <Stack direction="row" spacing={2}>
        <TextField
          label="Max Depth"
          type="number"
          size="small"
          fullWidth
          value={simConfig.sionna.max_depth}
          onChange={(e) =>
            updateSimConfigSionna({
              max_depth: parseNumberInputChange(e.target),
            })
          }
        />
        <TextField
          label="Num Samples"
          type="number"
          size="small"
          fullWidth
          value={simConfig.sionna.num_samples}
          onChange={(e) =>
            updateSimConfigSionna({
              num_samples: parseNumberInputChange(e.target),
            })
          }
        />
      </Stack>
      <Stack direction="row" flexWrap="wrap" gap={1}>
        {(['los', 'reflection', 'diffraction', 'scattering'] as const).map(
          (key) => (
            <FormControlLabel
              key={key}
              control={
                <Switch
                  checked={simConfig.sionna[key]}
                  onChange={(e) =>
                    updateSimConfigSionna({ [key]: e.target.checked })
                  }
                />
              }
              label={key.charAt(0).toUpperCase() + key.slice(1)}
            />
          )
        )}
      </Stack>
    </Stack>
  );
}
