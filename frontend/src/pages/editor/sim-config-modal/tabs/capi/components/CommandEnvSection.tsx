import {
  Divider,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { updateStringField, updateSwitchField } from '../utils/capiFieldUtils';
import type { CapiSectionProps } from '../capi.types';

export const CommandEnvSection = ({ capi, update }: CapiSectionProps) => (
  <>
    <Divider />
    <Typography variant="subtitle2" color="text.secondary">
      Command environment
    </Typography>
    <Stack direction="row" spacing={2} alignItems="center">
      <FormControlLabel
        control={
          <Switch
            checked={capi.cmdenv_express_mode}
            onChange={(e) =>
              updateSwitchField(e.target.checked, 'cmdenv_express_mode', update)
            }
          />
        }
        label="Express mode"
      />
    </Stack>
    <TextField
      label="Output file"
      size="small"
      fullWidth
      placeholder=".cmdenv-log"
      value={capi.cmdenv_output_file}
      onChange={(e) => updateStringField(e, 'cmdenv_output_file', update)}
    />
    <Stack direction="row" gap={1}>
      <FormControlLabel
        control={
          <Switch
            checked={capi.scalar_recording}
            onChange={(e) =>
              updateSwitchField(e.target.checked, 'scalar_recording', update)
            }
          />
        }
        label="Scalar recording"
      />
      <FormControlLabel
        control={
          <Switch
            checked={capi.vector_recording}
            onChange={(e) =>
              updateSwitchField(e.target.checked, 'vector_recording', update)
            }
          />
        }
        label="Vector recording"
      />
    </Stack>
  </>
);
