import { Divider, Stack, TextField, Typography } from '@mui/material';
import { parseNumberInputChange } from '@/shared/utils/numberInputUtils';
import { MPCConfig } from '../utils/MpcUtils';

type Props = {
  mpc: MPCConfig;
  update: (patch: Partial<MPCConfig>) => void;
};

export const LimitsSection = ({ mpc, update }: Props) => (
  <>
    <Divider />
    <Typography variant="subtitle2" color="text.secondary">
      Limits
    </Typography>
    <Stack direction="row" spacing={2}>
      <TextField
        label="steer_deg (°)"
        type="number"
        size="small"
        fullWidth
        inputProps={{ step: 1 }}
        value={mpc.steer_deg}
        onChange={(e) =>
          update({ steer_deg: parseNumberInputChange(e.target) })
        }
      />
      <TextField
        label="steer_change_deg (°/s)"
        type="number"
        size="small"
        fullWidth
        inputProps={{ step: 1 }}
        value={mpc.steer_change_deg}
        onChange={(e) =>
          update({ steer_change_deg: parseNumberInputChange(e.target) })
        }
      />
    </Stack>
    <Stack direction="row" spacing={2}>
      <TextField
        label="speed_max (km/h)"
        type="number"
        size="small"
        fullWidth
        inputProps={{ step: 1 }}
        value={mpc.speed_max_kph}
        onChange={(e) =>
          update({ speed_max_kph: parseNumberInputChange(e.target) })
        }
      />
      <TextField
        label="speed_min (km/h)"
        type="number"
        size="small"
        fullWidth
        inputProps={{ step: 1 }}
        value={mpc.speed_min_kph}
        onChange={(e) =>
          update({ speed_min_kph: parseNumberInputChange(e.target) })
        }
      />
    </Stack>
    <TextField
      label="acceleration_max (m/s²)"
      type="number"
      size="small"
      sx={{ width: '48%' }}
      inputProps={{ step: 0.1 }}
      value={mpc.acceleration_max}
      onChange={(e) =>
        update({ acceleration_max: parseNumberInputChange(e.target) })
      }
    />
  </>
);
