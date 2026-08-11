import { Divider, Typography, TextField, Stack } from '@mui/material';
import { parseNumberInputChange } from '../../../../utils/numberInputUtils';
import { MPCConfig } from '../utils/MpcUtils';

type Props = {
  mpc: MPCConfig;
  update: (patch: Partial<MPCConfig>) => void;
};

export const MPCWeightsSection = ({ mpc, update }: Props) => {
  const handleQfChange = (idx: number, value?: number) => {
    const Qf = [...mpc.Qf] as [number, number, number, number];
    Qf[idx] = value || 0;
    update({ Qf });
  };

  const handleRChange = (idx: number, value?: number) => {
    const R = [...mpc.R] as [number, number];
    R[idx] = value || 0;
    update({ R });
  };

  const handleRdChange = (idx: number, value?: number) => {
    const Rd = [...mpc.Rd] as [number, number];
    Rd[idx] = value || 0;
    update({ Rd });
  };

  return (
    <>
      <Divider />
      <Typography variant="subtitle2" color="text.secondary">
        MPC weights
      </Typography>
      <Typography variant="caption" color="text.secondary">
        Qf — end state penalty [x, y, v, phi]
      </Typography>
      <Stack direction="row" spacing={1}>
        {([0, 1, 2, 3] as const).map((idx) => (
          <TextField
            key={idx}
            label={`Qf[${idx}]`}
            type="number"
            size="small"
            fullWidth
            inputProps={{ step: 0.5 }}
            value={mpc.Qf[idx]}
            onChange={(e) =>
              handleQfChange(idx, parseNumberInputChange(e.target))
            }
          />
        ))}
      </Stack>
      <Typography variant="caption" color="text.secondary">
        R — input penalty [accel, steer]
      </Typography>
      <Stack direction="row" spacing={1}>
        {([0, 1] as const).map((idx) => (
          <TextField
            key={idx}
            label={`R[${idx}]`}
            type="number"
            size="small"
            fullWidth
            inputProps={{ step: 0.01 }}
            value={mpc.R[idx]}
            onChange={(e) =>
              handleRChange(idx, parseNumberInputChange(e.target))
            }
          />
        ))}
      </Stack>
      <Typography variant="caption" color="text.secondary">
        Rd — input change penalty [accel, steer]
      </Typography>
      <Stack direction="row" spacing={1}>
        {([0, 1] as const).map((idx) => (
          <TextField
            key={idx}
            label={`Rd[${idx}]`}
            type="number"
            size="small"
            fullWidth
            inputProps={{ step: 0.01 }}
            value={mpc.Rd[idx]}
            onChange={(e) =>
              handleRdChange(idx, parseNumberInputChange(e.target))
            }
          />
        ))}
      </Stack>
    </>
  );
};
