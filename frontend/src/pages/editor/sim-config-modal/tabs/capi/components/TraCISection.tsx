import { Divider, Stack, TextField, Typography } from '@mui/material';
import { updateNumberField, updateStringField } from '../utils/capiFieldUtils';
import type { CapiSectionProps } from '../capi.types';

export const TraCISection = ({ capi, update }: CapiSectionProps) => (
  <>
    <Divider />
    <Typography variant="subtitle2" color="text.secondary">
      TraCI (ConnectLauncher)
    </Typography>
    <Stack direction="row" spacing={2}>
      <TextField
        label="Hostname"
        size="small"
        fullWidth
        placeholder="sumo"
        value={capi.traci_hostname}
        onChange={(e) => updateStringField(e, 'traci_hostname', update)}
      />
      <TextField
        label="Port"
        type="number"
        size="small"
        fullWidth
        value={capi.traci_port}
        onChange={(e) => updateNumberField(e, 'traci_port', update)}
      />
    </Stack>
  </>
);
