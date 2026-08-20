import {
  Box,
  Button,
  Divider,
  IconButton,
  Stack,
  TextField,
  Tooltip,
} from '@mui/material';
import { DeleteOutline as DeleteOutlineIcon } from '@mui/icons-material';
import { Add as AddIcon } from '@mui/icons-material';
import { JsonField } from './JsonField';
import { StageEditor } from './StageEditor';
import type {
  OpenCDAAttackConfig,
  OpenCDAAttackStage,
} from '@editor/Generators/types/configGeneratorsTypes';

interface AttackEditorProps {
  attack: OpenCDAAttackConfig;
  attackIndex: number;
  onUpdate: (patch: Partial<OpenCDAAttackConfig>) => void;
  onDelete: () => void;
  onUpdateStage: (index: number, stage: OpenCDAAttackStage) => void;
  onAddStage: () => void;
  onDeleteStage: (index: number) => void;
}

export function AttackEditor({
  attack,
  attackIndex,
  onUpdate,
  onDelete,
  onUpdateStage,
  onAddStage,
  onDeleteStage,
}: AttackEditorProps) {
  const keyPrefix = `attack-${attackIndex}-${attack.name}`;

  return (
    <Stack spacing={1.5}>
      <Stack direction="row" spacing={1} alignItems="center">
        <TextField
          label="attack.name"
          size="small"
          fullWidth
          value={attack.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
        />
        <Tooltip title="Delete attack">
          <IconButton color="error" onClick={onDelete}>
            <DeleteOutlineIcon />
          </IconButton>
        </Tooltip>
      </Stack>

      <Divider textAlign="left" sx={{ fontSize: 12 }}>
        Stages ({attack.stages?.length ?? 0})
      </Divider>

      {attack.stages?.map((stage, idx) => (
        <Box
          key={stage.id || `${keyPrefix}-stage-${idx}`}
          sx={{
            p: 2,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
          }}
        >
          <StageEditor
            stage={stage}
            onUpdate={(updated) => onUpdateStage(idx, updated)}
            onDelete={() => onDeleteStage(idx)}
          />
        </Box>
      ))}

      <Button
        size="small"
        variant="outlined"
        startIcon={<AddIcon />}
        onClick={onAddStage}
        sx={{ alignSelf: 'flex-start' }}
      >
        Add stage
      </Button>

      <Divider textAlign="left" sx={{ fontSize: 12 }}>
        Advanced (JSON)
      </Divider>

      <JsonField
        key={`${keyPrefix}-requirements`}
        label="requirements"
        value={attack.requirements}
        onChange={(value) => onUpdate({ requirements: value })}
      />
      <JsonField
        key={`${keyPrefix}-start_trigger`}
        label="start_trigger"
        value={attack.start_trigger}
        onChange={(value) => onUpdate({ start_trigger: value })}
      />
      <JsonField
        key={`${keyPrefix}-stop_trigger`}
        label="stop_trigger"
        value={attack.stop_trigger}
        onChange={(value) => onUpdate({ stop_trigger: value })}
      />
      <JsonField
        key={`${keyPrefix}-targets`}
        label="targets"
        value={attack.targets}
        onChange={(value) => onUpdate({ targets: value })}
      />
    </Stack>
  );
}
