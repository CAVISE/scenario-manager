import { Divider, Stack, TextField, Typography } from '@mui/material';
import { parseNumberInputChange } from '@/shared/utils/numberInputUtils';
import type { MpcSectionProps } from '../types/mpcTypes';

export const LimitsSection = ({ mpc, update }: MpcSectionProps) => (
  <>
    <Divider />
    <Typography
      variant="subtitle2"
      sx={{
        color: 'text.secondary',
      }}
    >
      Limits
    </Typography>
    <Stack direction="row" spacing={2}>
      <TextField
        label="steer_deg (°)"
        type="number"
        size="small"
        fullWidth
        value={mpc.steer_deg}
        onChange={(e) =>
          update({ steer_deg: parseNumberInputChange(e.target) })
        }
        slotProps={{
          htmlInput: { step: 1 },
        }}
      />
      <TextField
        label="steer_change_deg (°/s)"
        type="number"
        size="small"
        fullWidth
        value={mpc.steer_change_deg}
        onChange={(e) =>
          update({ steer_change_deg: parseNumberInputChange(e.target) })
        }
        slotProps={{
          htmlInput: { step: 1 },
        }}
      />
    </Stack>
    <Stack direction="row" spacing={2}>
      <TextField
        label="speed_max (km/h)"
        type="number"
        size="small"
        fullWidth
        value={mpc.speed_max_kph}
        onChange={(e) =>
          update({ speed_max_kph: parseNumberInputChange(e.target) })
        }
        slotProps={{
          htmlInput: { step: 1 },
        }}
      />
      <TextField
        label="speed_min (km/h)"
        type="number"
        size="small"
        fullWidth
        value={mpc.speed_min_kph}
        onChange={(e) =>
          update({ speed_min_kph: parseNumberInputChange(e.target) })
        }
        slotProps={{
          htmlInput: { step: 1 },
        }}
      />
    </Stack>
    <TextField
      label="acceleration_max (m/s²)"
      type="number"
      size="small"
      className="sim-config-field--half"
      value={mpc.acceleration_max}
      onChange={(e) =>
        update({ acceleration_max: parseNumberInputChange(e.target) })
      }
      slotProps={{
        htmlInput: { step: 0.1 },
      }}
    />
  </>
);
