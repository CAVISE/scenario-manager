import { Divider, Stack, TextField, Typography } from '@mui/material';
import { updateNumberField, updateStringField } from '../utils/capiFieldUtils';
import type { CapiSectionProps } from '../capi.types';

export const RadioSection = ({ capi, update }: CapiSectionProps) => (
  <>
    <Divider />
    <Typography variant="subtitle2" color="text.secondary">
      Radio
    </Typography>
    <Stack direction="row" spacing={2}>
      <TextField
        label="Carrier frequency"
        size="small"
        fullWidth
        placeholder="5.9 GHz"
        value={capi.carrier_frequency}
        onChange={(e) => updateStringField(e, 'carrier_frequency', update)}
      />
      <TextField
        label="TX power"
        size="small"
        fullWidth
        placeholder="200 mW"
        value={capi.tx_power}
        onChange={(e) => updateStringField(e, 'tx_power', update)}
      />
    </Stack>
    <TextField
      label="Channel number"
      type="number"
      size="small"
      value={capi.channel_number}
      onChange={(e) => updateNumberField(e, 'channel_number', update)}
      sx={{ width: '48%' }}
    />
  </>
);
