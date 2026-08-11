import { Stack, TextField, Typography } from '@mui/material';
import { parseNumberInputChange } from '../../../../../../shared/utils/numberInput';
import type { MpcSectionProps } from '../mpc.types';

export const SystemSection = ({ mpc, update }: MpcSectionProps) => (
  <>
    <Typography variant="subtitle2" color="text.secondary">
      System
    </Typography>
    <Stack direction="row" spacing={2}>
      <TextField
        label="NX (state dim)"
        type="number"
        size="small"
        fullWidth
        value={mpc.NX}
        onChange={(e) => update({ NX: parseNumberInputChange(e.target) })}
      />
      <TextField
        label="NU (input dim)"
        type="number"
        size="small"
        fullWidth
        value={mpc.NU}
        onChange={(e) => update({ NU: parseNumberInputChange(e.target) })}
      />
    </Stack>
    <Stack direction="row" spacing={2}>
      <TextField
        label="T (horizon)"
        type="number"
        size="small"
        fullWidth
        value={mpc.T}
        onChange={(e) => update({ T: parseNumberInputChange(e.target) })}
      />
      <TextField
        label="T_aug"
        type="number"
        size="small"
        fullWidth
        value={mpc.T_aug}
        onChange={(e) => update({ T_aug: parseNumberInputChange(e.target) })}
      />
    </Stack>
  </>
);
