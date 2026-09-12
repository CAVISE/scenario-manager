import { Stack, TextField, Typography } from '@mui/material';
import { updateStringField } from '../utils/capiFieldUtils';
import type { CapiSectionProps } from '../capi.types';

export const NetworkSection = ({ capi, update }: CapiSectionProps) => (
  <Stack spacing={2}>
    <Typography variant="subtitle2" color="text.secondary">
      Network
    </Typography>
    <TextField
      label="Network"
      size="small"
      fullWidth
      placeholder="artery.inet.World"
      value={capi.network}
      onChange={(e) => updateStringField(e, 'network', update)}
    />
  </Stack>
);
