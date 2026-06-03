import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Divider,
  IconButton,
  Modal,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import { useEditorStore } from '../../../../../store';
import {
  mergeSimConfigWithDefaults,
  type OpenCDAAttackConfig,
} from '../../../Generators/types/configGeneratorsTypes';
import {
  attackModalSx,
  defaultAttackConfig,
  type AttackConfigModalProps,
} from '../types/AttackConfigModalTypes';

function JsonField({
  label,
  value,
  onChange,
  minRows = 4,
}: {
  label: string;
  value: unknown;
  onChange: (value: Record<string, unknown> | undefined) => void;
  minRows?: number;
}) {
  const [raw, setRaw] = useState(() =>
    value == null ? '' : JSON.stringify(value, null, 2),
  );
  const [error, setError] = useState('');

  useEffect(() => {
    setRaw(value == null ? '' : JSON.stringify(value, null, 2));
    setError('');
  }, [value]);

  return (
    <TextField
      label={label}
      multiline
      minRows={minRows}
      fullWidth
      size="small"
      value={raw}
      error={Boolean(error)}
      helperText={error || 'JSON object'}
      onChange={(e) => {
        const next = e.target.value;
        setRaw(next);
        if (next.trim() === '') {
          setError('');
          onChange(undefined);
          return;
        }
        try {
          const parsed = JSON.parse(next) as unknown;
          if (
            typeof parsed !== 'object' ||
            parsed == null ||
            Array.isArray(parsed)
          ) {
            setError('Must be a JSON object');
            return;
          }
          setError('');
          onChange(parsed as Record<string, unknown>);
        } catch {
          setError('Invalid JSON');
        }
      }}
    />
  );
}

export default function AttackConfigModal({
  open,
  onClose,
}: AttackConfigModalProps) {
  const simConfig = mergeSimConfigWithDefaults(
    useEditorStore((s) => s.simConfig),
  );
  const updateSimConfig = useEditorStore((s) => s.updateSimConfig);
  const attacks = simConfig.attacks ?? [];
  const [selectedAttack, setSelectedAttack] = useState(0);

  const current = useMemo(
    () => attacks[selectedAttack] ?? null,
    [attacks, selectedAttack],
  );

  const updateAttackAt = (
    index: number,
    patch: Partial<OpenCDAAttackConfig>,
  ) => {
    const next = [...attacks];
    next[index] = { ...next[index], ...patch };
    updateSimConfig({ attacks: next });
  };

  const addAttack = () => {
    const next = [...attacks, defaultAttackConfig()];
    updateSimConfig({
      attacks: next,
      opencda: { ...simConfig.opencda, export_attacks: true },
    });
    setSelectedAttack(next.length - 1);
  };

  const removeCurrentAttack = () => {
    if (!current) return;
    const next = attacks.filter((_, idx) => idx !== selectedAttack);
    updateSimConfig({ attacks: next });
    setSelectedAttack(Math.max(0, selectedAttack - 1));
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={attackModalSx}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography variant="h6">Attack Configuration</Typography>
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={addAttack}
            >
              Add attack
            </Button>
            <Button onClick={onClose} variant="outlined" size="small">
              Close
            </Button>
          </Stack>
        </Stack>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 1, mb: 2 }}
        >
          Configure top-level `attacks` list for OpenCDA adversary framework.
        </Typography>
        <Divider sx={{ mb: 2 }} />

        {attacks.length === 0 ? (
          <Typography color="text.secondary">
            No attacks configured. Click “Add attack”.
          </Typography>
        ) : (
          <Stack spacing={2}>
            <Stack direction="row" gap={1} flexWrap="wrap">
              {attacks.map((attack, idx) => (
                <Button
                  key={`${attack.name}-${idx}`}
                  size="small"
                  variant={idx === selectedAttack ? 'contained' : 'outlined'}
                  onClick={() => setSelectedAttack(idx)}
                >
                  {attack.name || `attack_${idx + 1}`}
                </Button>
              ))}
            </Stack>

            {current && (
              <Stack spacing={1.5}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <TextField
                    label="attack.name"
                    size="small"
                    fullWidth
                    value={current.name}
                    onChange={(e) =>
                      updateAttackAt(selectedAttack, { name: e.target.value })
                    }
                  />
                  <Tooltip title="Delete attack">
                    <IconButton color="error" onClick={removeCurrentAttack}>
                      <DeleteOutlineIcon />
                    </IconButton>
                  </Tooltip>
                </Stack>

                <JsonField
                  label="requirements"
                  value={current.requirements}
                  onChange={(value) =>
                    updateAttackAt(selectedAttack, { requirements: value })
                  }
                />
                <JsonField
                  label="start_trigger"
                  value={current.start_trigger}
                  onChange={(value) =>
                    updateAttackAt(selectedAttack, { start_trigger: value })
                  }
                />
                <JsonField
                  label="stop_trigger"
                  value={current.stop_trigger}
                  onChange={(value) =>
                    updateAttackAt(selectedAttack, { stop_trigger: value })
                  }
                />
                <JsonField
                  label="targets"
                  value={current.targets}
                  onChange={(value) =>
                    updateAttackAt(selectedAttack, { targets: value })
                  }
                />
                <TextField
                  label="stages (JSON array)"
                  multiline
                  minRows={6}
                  fullWidth
                  size="small"
                  value={JSON.stringify(current.stages ?? [], null, 2)}
                  helperText="Array of stage objects"
                  onChange={(e) => {
                    const raw = e.target.value.trim();
                    if (!raw) {
                      updateAttackAt(selectedAttack, { stages: [] });
                      return;
                    }
                    try {
                      const parsed = JSON.parse(raw) as unknown;
                      if (Array.isArray(parsed)) {
                        updateAttackAt(selectedAttack, {
                          stages: parsed as OpenCDAAttackConfig['stages'],
                        });
                      }
                    } catch {
                      // Keep draft text; we don't overwrite state on invalid JSON.
                    }
                  }}
                />
              </Stack>
            )}
          </Stack>
        )}
      </Box>
    </Modal>
  );
}
