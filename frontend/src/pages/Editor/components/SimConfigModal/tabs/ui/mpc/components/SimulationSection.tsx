import { Divider, Typography, TextField, Stack } from '@mui/material';
import { parseNumberInputChange } from '@/shared/utils/numberInputUtils';
import { MPCConfig } from '../utils/MpcUtils';

type Props = {
  mpc: MPCConfig;
  update: (patch: Partial<MPCConfig>) => void;
};

export const SimulationSection = ({ mpc, update }: Props) => (
  <>
    <Divider />
    <Typography variant="subtitle2" color="text.secondary">
      Simulation
    </Typography>
    <Stack direction="row" spacing={2}>
      <TextField
        label="dist_stop (m)"
        type="number"
        size="small"
        fullWidth
        inputProps={{ step: 0.1 }}
        value={mpc.dist_stop}
        onChange={(e) =>
          update({ dist_stop: parseNumberInputChange(e.target) })
        }
      />
      <TextField
        label="speed_stop (m/s)"
        type="number"
        size="small"
        fullWidth
        inputProps={{ step: 0.1 }}
        value={mpc.speed_stop}
        onChange={(e) =>
          update({ speed_stop: parseNumberInputChange(e.target) })
        }
      />
    </Stack>
    <Stack direction="row" spacing={2}>
      <TextField
        label="time_max (s)"
        type="number"
        size="small"
        fullWidth
        value={mpc.time_max}
        onChange={(e) => update({ time_max: parseNumberInputChange(e.target) })}
      />
      <TextField
        label="iter_max"
        type="number"
        size="small"
        fullWidth
        value={mpc.iter_max}
        onChange={(e) => update({ iter_max: parseNumberInputChange(e.target) })}
      />
    </Stack>
    <Stack direction="row" spacing={2}>
      <TextField
        label="target_speed (m/s)"
        type="number"
        size="small"
        fullWidth
        inputProps={{ step: 0.5 }}
        value={mpc.target_speed}
        onChange={(e) =>
          update({ target_speed: parseNumberInputChange(e.target) })
        }
      />
      <TextField
        label="n_ind"
        type="number"
        size="small"
        fullWidth
        value={mpc.n_ind}
        onChange={(e) => update({ n_ind: parseNumberInputChange(e.target) })}
      />
    </Stack>
    <Stack direction="row" spacing={2}>
      <TextField
        label="dt (s)"
        type="number"
        size="small"
        fullWidth
        inputProps={{ step: 0.01 }}
        value={mpc.dt}
        onChange={(e) => update({ dt: parseNumberInputChange(e.target) || 0 })}
      />
      <TextField
        label="d_dist (m)"
        type="number"
        size="small"
        fullWidth
        inputProps={{ step: 0.1 }}
        value={mpc.d_dist}
        onChange={(e) => update({ d_dist: parseNumberInputChange(e.target) })}
      />
    </Stack>
    <TextField
      label="du_res"
      type="number"
      size="small"
      sx={{ width: '48%' }}
      inputProps={{ step: 0.05 }}
      value={mpc.du_res}
      onChange={(e) => update({ du_res: parseNumberInputChange(e.target) })}
    />
  </>
);
