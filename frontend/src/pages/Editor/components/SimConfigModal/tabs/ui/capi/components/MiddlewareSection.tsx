import { Divider, Stack, TextField, Typography } from '@mui/material';
import { updateNumberField, updateStringField } from '../utils/capiFieldUtils';
import { CapiConfig } from '../hooks/useCapiConfig';

type Props = {
  capi: CapiConfig;
  update: (patch: Partial<CapiConfig>) => void;
};

export const MiddlewareSection = ({ capi, update }: Props) => (
  <>
    <Divider />
    <Typography variant="subtitle2" color="text.secondary">
      Middleware
    </Typography>
    <Stack direction="row" spacing={2}>
      <TextField
        label="Update interval (s)"
        type="number"
        size="small"
        fullWidth
        inputProps={{ step: 0.01 }}
        value={capi.middleware_update_interval}
        onChange={(e) =>
          updateNumberField(e, 'middleware_update_interval', update)
        }
      />
      <TextField
        label="Datetime"
        size="small"
        fullWidth
        value={capi.datetime}
        onChange={(e) => updateStringField(e, 'datetime', update)}
      />
    </Stack>
  </>
);
