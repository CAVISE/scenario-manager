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
import { CapiConfig } from '../hooks/useCapiConfig';

type Props = {
  capi: CapiConfig;
  update: (patch: Partial<CapiConfig>) => void;
};

const LOG_LEVELS: CapiConfig['capi_log_level'][] = [
  'debug',
  'info',
  'warn',
  'error',
];

export const CAPIConnectionSection = ({ capi, update }: Props) => (
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
        {LOG_LEVELS.map((level) => (
          <MenuItem key={level} value={level}>
            {level}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  </>
);
