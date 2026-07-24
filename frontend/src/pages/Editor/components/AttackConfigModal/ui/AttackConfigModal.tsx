import { nanoid } from 'nanoid';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Button,
  Chip,
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
  normalizeAttackStages,
  type OpenCDAAttackConfig,
  type OpenCDAAttackStage,
} from '../../../Generators/types/configGeneratorsTypes';
import {
  attackModalSx,
  defaultAttackConfig,
  type AttackConfigModalProps,
} from '../types/AttackConfigModalTypes';

const GNSS_DRIFT_PARAMS = {
  mode: 'drift',
  start_time: 10,
  ramp_duration: 8,
  lateral_offset: 1.8,
  longitudinal_offset: 0.5,
  drift_rate: 0.08,
  jitter_stddev: 0.08,
  max_offset: 3,
} as const;

const GNSS_SPOOFER_PRESET: OpenCDAAttackConfig = {
  name: 'gnss_spoof',
  requirements: {},
  start_trigger: {},
  stop_trigger: {},
  targets: { cav_index: 1 },
  stages: [{ id: nanoid(6), type: 'spoofer', params: GNSS_DRIFT_PARAMS }],
};

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
  const valueRef = useRef(value == null ? '' : JSON.stringify(value, null, 2));
  const [raw, setRaw] = useState(() => valueRef.current);
  const [error, setError] = useState('');

  useEffect(() => {
    const next = value == null ? '' : JSON.stringify(value, null, 2);
    if (next !== valueRef.current) {
      valueRef.current = next;
      setRaw(next);
      setError('');
    }
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
          valueRef.current = JSON.stringify(parsed, null, 2);
          onChange(parsed as Record<string, unknown>);
        } catch {
          setError('Invalid JSON');
        }
      }}
    />
  );
}

// Local state prevents the text from resetting while the user is typing.

function StagesField({
  value,
  onChange,
}: {
  value: OpenCDAAttackStage[] | undefined;
  onChange: (stages: OpenCDAAttackStage[]) => void;
}) {
  const valueRef = useRef(JSON.stringify(value ?? [], null, 2));
  const [raw, setRaw] = useState(() => valueRef.current);
  const [error, setError] = useState('');

  // Sync only when the external value changes, such as when applying a preset
  // or selecting an attack, not after rerenders caused by this field's onChange.
  useEffect(() => {
    const next = JSON.stringify(value ?? [], null, 2);
    if (next !== valueRef.current) {
      valueRef.current = next;
      setRaw(next);
      setError('');
    }
  }, [value]);

  return (
    <TextField
      label="stages (JSON array)"
      multiline
      minRows={6}
      fullWidth
      size="small"
      value={raw}
      error={Boolean(error)}
      helperText={
        error ||
        'Array of stage objects, including the attack type and parameters'
      }
      onChange={(e) => {
        const next = e.target.value;
        setRaw(next);
        if (next.trim() === '' || next.trim() === '[]') {
          setError('');
          onChange([]);
          return;
        }
        try {
          const parsed = JSON.parse(next) as unknown;
          if (!Array.isArray(parsed)) {
            setError('Must be a JSON array');
            return;
          }
          const normalized = normalizeAttackStages(parsed);
          setError('');
          valueRef.current = JSON.stringify(normalized, null, 2);
          onChange(normalized);
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
  const attacks = useMemo(() => simConfig.attacks ?? [], [simConfig.attacks]);
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
    const current = next[index] ?? {};
    const stages = patch.stages
      ? normalizeAttackStages(patch.stages)
      : normalizeAttackStages(current.stages);
    next[index] = { ...current, ...patch, stages };
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

  const addGnssSpoofer = () => {
    const preset = {
      ...GNSS_SPOOFER_PRESET,
      name: `gnss_spoof_${attacks.length + 1}`,
      stages: [{ id: nanoid(6), type: 'spoofer', params: GNSS_DRIFT_PARAMS }],
    };
    const next = [...attacks, preset];
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
              variant="contained"
              color="warning"
              startIcon={<AddIcon />}
              onClick={addGnssSpoofer}
            >
              + GNSS Spoofer
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={addAttack}
            >
              Add blank
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
            No attacks configured. Click &quot;+ GNSS Spoofer&quot; or &quot;Add
            blank&quot;.
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
                  endIcon={
                    (attack.stages?.length ?? 0) > 0 ? (
                      <Chip
                        label={attack.stages![0].type}
                        size="small"
                        color="success"
                        sx={{ height: 16, fontSize: 10 }}
                      />
                    ) : undefined
                  }
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
                <StagesField
                  key={selectedAttack}
                  value={current.stages}
                  onChange={(stages) =>
                    updateAttackAt(selectedAttack, { stages })
                  }
                />
              </Stack>
            )}
          </Stack>
        )}
      </Box>
    </Modal>
  );
}
