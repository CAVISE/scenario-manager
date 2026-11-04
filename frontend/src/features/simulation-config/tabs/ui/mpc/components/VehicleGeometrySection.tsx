import { Divider, Stack, TextField, Typography } from '@mui/material';
import { parseNumberInputChange } from '@/shared/utils/numberInputUtils';
import type { MpcSectionProps } from '../types/mpcTypes';

export const VehicleGeometrySection = ({ mpc, update }: MpcSectionProps) => (
  <>
    <Divider />
    <Typography
      variant="subtitle2"
      sx={{
        color: 'text.secondary',
      }}
    >
      Vehicle geometry
    </Typography>
    <Stack direction="row" spacing={2}>
      <TextField
        label="RF (m)"
        type="number"
        size="small"
        fullWidth
        value={mpc.RF}
        onChange={(e) => update({ RF: parseNumberInputChange(e.target) })}
        slotProps={{
          htmlInput: { step: 0.1 },
        }}
      />
      <TextField
        label="RB (m)"
        type="number"
        size="small"
        fullWidth
        value={mpc.RB}
        onChange={(e) => update({ RB: parseNumberInputChange(e.target) })}
        slotProps={{
          htmlInput: { step: 0.1 },
        }}
      />
    </Stack>
    <Stack direction="row" spacing={2}>
      <TextField
        label="W (m)"
        type="number"
        size="small"
        fullWidth
        value={mpc.W}
        onChange={(e) => update({ W: parseNumberInputChange(e.target) })}
        slotProps={{
          htmlInput: { step: 0.1 },
        }}
      />
      <TextField
        label="wd_ratio"
        type="number"
        size="small"
        fullWidth
        value={mpc.wd_ratio}
        onChange={(e) => update({ wd_ratio: parseNumberInputChange(e.target) })}
        slotProps={{
          htmlInput: { step: 0.05 },
        }}
      />
    </Stack>
    <Stack direction="row" spacing={2}>
      <TextField
        label="WB (m)"
        type="number"
        size="small"
        fullWidth
        value={mpc.WB}
        onChange={(e) => update({ WB: parseNumberInputChange(e.target) })}
        slotProps={{
          htmlInput: { step: 0.1 },
        }}
      />
      <TextField
        label="TR (m)"
        type="number"
        size="small"
        fullWidth
        value={mpc.TR}
        onChange={(e) => update({ TR: parseNumberInputChange(e.target) })}
        slotProps={{
          htmlInput: { step: 0.01 },
        }}
      />
    </Stack>
    <TextField
      label="TW (m)"
      type="number"
      size="small"
      className="sim-config-field--half"
      value={mpc.TW}
      onChange={(e) => update({ TW: parseNumberInputChange(e.target) })}
      slotProps={{
        htmlInput: { step: 0.05 },
      }}
    />
  </>
);
