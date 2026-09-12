import {
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  updateNumberField,
  updateSelectField,
  updateStringField,
} from '../utils/capiFieldUtils';
import type { CapiConfig, CapiSectionProps } from '../capi.types';
import { CAPI_LOG_LEVELS } from '../capi.constants';

export const CAPIConnectionSection = ({ capi, update }: CapiSectionProps) => (
  <>
    <Divider />
    <Typography variant="subtitle2" color="text.secondary">
      CAPI connection
    </Typography>
    <Stack direction="row" spacing={2}>
      <TextField
        label="Address"
        size="small"
        fullWidth
        placeholder="tcp://*:7777"
        value={capi.address}
        onChange={(e) => updateStringField(e, 'address', update)}
      />
      <TextField
        label="Client ID"
        type="number"
        size="small"
        fullWidth
        value={capi.client_id}
        onChange={(e) => updateNumberField(e, 'client_id', update)}
      />
    </Stack>
    <FormControl size="small" fullWidth>
      <InputLabel>Log level</InputLabel>
      <Select
        value={capi.capi_log_level}
        label="Log level"
        onChange={(e) =>
          updateSelectField(
            e.target.value as CapiConfig['capi_log_level'],
            'capi_log_level',
            update,
          )
        }
      >
        {CAPI_LOG_LEVELS.map((level) => (
          <MenuItem key={level} value={level}>
            {level}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  </>
);
