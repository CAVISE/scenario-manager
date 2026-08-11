import { useState } from 'react';
import {
  FormControlLabel,
  IconButton,
  Stack,
  Switch,
  TextField,
  Tooltip,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { GnssSpooferForm } from './GnssSpooferForm';
import type { OpenCDAAttackStage } from '../../../Generators/types/configGeneratorsTypes';

interface StageEditorProps {
  stage: OpenCDAAttackStage | undefined;
  onUpdate: (stage: OpenCDAAttackStage) => void;
  onDelete: () => void;
}

export function StageEditor({ stage, onUpdate, onDelete }: StageEditorProps) {
  const [useStructuredForm, setUseStructuredForm] = useState(
    stage?.type === 'spoofer',
  );

  if (!stage) return null;

  return (
    <Stack spacing={1.5}>
      <Stack direction="row" spacing={1} alignItems="center">
        <TextField
          label="Stage type"
          size="small"
          value={stage.type}
          onChange={(e) =>
            onUpdate({
              ...stage,
              type: e.target.value as OpenCDAAttackStage['type'],
            })
          }
          sx={{ flex: 1 }}
          helperText="spoofer, sniffer, dropper, replayer, or custom"
        />
        <FormControlLabel
          control={
            <Switch
              checked={useStructuredForm}
              onChange={(e) => setUseStructuredForm(e.target.checked)}
              disabled={stage.type !== 'spoofer'}
            />
          }
          label="Structured form"
          sx={{ ml: 1 }}
        />
        <Tooltip title="Delete stage">
          <IconButton color="error" onClick={onDelete}>
            <DeleteOutlineIcon />
          </IconButton>
        </Tooltip>
      </Stack>

      {useStructuredForm && stage.type === 'spoofer' ? (
        <GnssSpooferForm stage={stage} onUpdate={onUpdate} />
      ) : (
        <TextField
          label="params (JSON)"
          multiline
          minRows={4}
          fullWidth
          size="small"
          value={JSON.stringify(stage.params || {}, null, 2)}
          onChange={(e) => {
            try {
              const parsed = JSON.parse(e.target.value);
              onUpdate({ ...stage, params: parsed });
            } catch {
              // Allow invalid JSON during editing
            }
          }}
          helperText="Edit params as JSON"
        />
      )}
    </Stack>
  );
}
