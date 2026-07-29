import { FormControlLabel, Stack, Switch, TextField } from '@mui/material';
import { useEditorStore } from '../../../../../../store';

export default function SionnaTab() {
  const simConfig = useEditorStore((s) => s.simConfig);
  const updateSimConfigSionna = useEditorStore((s) => s.updateSimConfigSionna);
  return (
    <Stack spacing={2}>
      <TextField
        key={`carrier_frequency-${simConfig.sionna.carrier_frequency}`}
        label="Carrier Frequency (Hz)"
        type="number"
        size="small"
        fullWidth
        value={simConfig.sionna.carrier_frequency}
        onChange={(e) =>
          updateSimConfigSionna({ carrier_frequency: Number(e.target.value) })
        }
      />
      <Stack direction="row" spacing={2}>
        <TextField
          key={`max_depth-${simConfig.sionna.max_depth}`}
          label="Max Depth"
          type="number"
          size="small"
          fullWidth
          value={simConfig.sionna.max_depth}
          onChange={(e) =>
            updateSimConfigSionna({ max_depth: Number(e.target.value) })
          }
        />
        <TextField
          key={`num_samples-${simConfig.sionna.num_samples}`}
          label="Num Samples"
          type="number"
          size="small"
          fullWidth
          value={simConfig.sionna.num_samples}
          onChange={(e) =>
            updateSimConfigSionna({ num_samples: Number(e.target.value) })
          }
        />
      </Stack>
      <Stack direction="row" flexWrap="wrap" gap={1}>
        {(['los', 'reflection', 'diffraction', 'scattering'] as const).map(
          (key, idx: number) => (
            <FormControlLabel
              key={`${key}_${idx}`}
              control={
                <Switch
                  key={`sionna-${key}`}
                  checked={simConfig.sionna[key]}
                  onChange={(e) =>
                    updateSimConfigSionna({ [key]: e.target.checked })
                  }
                />
              }
              label={key.charAt(0).toUpperCase() + key.slice(1)}
            />
          ),
        )}
      </Stack>
    </Stack>
  );
}
