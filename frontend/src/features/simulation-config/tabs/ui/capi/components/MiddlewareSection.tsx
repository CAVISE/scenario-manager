import { Divider, Stack, TextField, Typography } from '@mui/material';
import { updateNumberField, updateStringField } from '../utils/capiFieldUtils';
import type { CapiSectionProps } from '../types/capiTypes';

export const MiddlewareSection = ({ capi, update }: CapiSectionProps) => (
  <>
    <Divider />
    <Typography
      variant="subtitle2"
      sx={{
        color: 'text.secondary',
      }}
    >
      Middleware
    </Typography>
    <Stack direction="row" spacing={2}>
      <TextField
        label="Update interval (s)"
        type="number"
        size="small"
        fullWidth
        value={capi.middleware_update_interval}
        onChange={(e) =>
          updateNumberField(e, 'middleware_update_interval', update)
        }
        slotProps={{
          htmlInput: { step: 0.01 },
        }}
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
