import { Divider, Stack, TextField, Typography } from '@mui/material';
import { parseNumberInputChange } from '../../../../../../shared/utils/numberInput';
import { MPCConfig } from '../utils/MpcUtils';

type Props = {
  mpc: MPCConfig;
  update: (patch: Partial<MPCConfig>) => void;
};

export const VehicleGeometrySection = ({ mpc, update }: Props) => (
  <>
    <Divider />
    <Typography variant="subtitle2" color="text.secondary">
      Vehicle geometry
    </Typography>
    <Stack direction="row" spacing={2}>
      <TextField
        label="RF (m)"
        type="number"
        size="small"
        fullWidth
        inputProps={{ step: 0.1 }}
        value={mpc.RF}
        onChange={(e) => update({ RF: parseNumberInputChange(e.target) })}
      />
      <TextField
        label="RB (m)"
        type="number"
        size="small"
        fullWidth
        inputProps={{ step: 0.1 }}
        value={mpc.RB}
        onChange={(e) => update({ RB: parseNumberInputChange(e.target) })}
      />
    </Stack>
    <Stack direction="row" spacing={2}>
      <TextField
        label="W (m)"
        type="number"
        size="small"
        fullWidth
        inputProps={{ step: 0.1 }}
        value={mpc.W}
        onChange={(e) => update({ W: parseNumberInputChange(e.target) })}
      />
      <TextField
        label="wd_ratio"
        type="number"
        size="small"
        fullWidth
        inputProps={{ step: 0.05 }}
        value={mpc.wd_ratio}
        onChange={(e) => update({ wd_ratio: parseNumberInputChange(e.target) })}
      />
    </Stack>
    <Stack direction="row" spacing={2}>
      <TextField
        label="WB (m)"
        type="number"
        size="small"
        fullWidth
        inputProps={{ step: 0.1 }}
        value={mpc.WB}
        onChange={(e) => update({ WB: parseNumberInputChange(e.target) })}
      />
      <TextField
        label="TR (m)"
        type="number"
        size="small"
        fullWidth
        inputProps={{ step: 0.01 }}
        value={mpc.TR}
        onChange={(e) => update({ TR: parseNumberInputChange(e.target) })}
      />
    </Stack>
    <TextField
      label="TW (m)"
      type="number"
      size="small"
      sx={{ width: '48%' }}
      inputProps={{ step: 0.05 }}
      value={mpc.TW}
      onChange={(e) => update({ TW: parseNumberInputChange(e.target) })}
    />
  </>
);
