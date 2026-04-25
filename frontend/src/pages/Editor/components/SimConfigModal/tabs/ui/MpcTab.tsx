import { Divider, Stack, TextField, Typography } from '@mui/material';
import { useEditorStore } from '../../../../../../store';

export default function MpcTab() {
  const updateSimConfigMPC = useEditorStore((s) => s.updateSimConfigMPC);
  const mpc = useEditorStore((s) => s.simConfig.mpc);
  return (
    <Stack spacing={2}>
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
          onChange={(e) => updateSimConfigMPC({ NX: Number(e.target.value) })}
        />
        <TextField
          label="NU (input dim)"
          type="number"
          size="small"
          fullWidth
          value={mpc.NU}
          onChange={(e) => updateSimConfigMPC({ NU: Number(e.target.value) })}
        />
      </Stack>
      <Stack direction="row" spacing={2}>
        <TextField
          label="T (horizon)"
          type="number"
          size="small"
          fullWidth
          value={mpc.T}
          onChange={(e) => updateSimConfigMPC({ T: Number(e.target.value) })}
        />
        <TextField
          label="T_aug"
          type="number"
          size="small"
          fullWidth
          value={mpc.T_aug}
          onChange={(e) =>
            updateSimConfigMPC({ T_aug: Number(e.target.value) })
          }
        />
      </Stack>

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
            updateSimConfigMPC({ dist_stop: Number(e.target.value) })
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
            updateSimConfigMPC({ speed_stop: Number(e.target.value) })
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
          onChange={(e) =>
            updateSimConfigMPC({ time_max: Number(e.target.value) })
          }
        />
        <TextField
          label="iter_max"
          type="number"
          size="small"
          fullWidth
          value={mpc.iter_max}
          onChange={(e) =>
            updateSimConfigMPC({ iter_max: Number(e.target.value) })
          }
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
            updateSimConfigMPC({ target_speed: Number(e.target.value) })
          }
        />
        <TextField
          label="n_ind"
          type="number"
          size="small"
          fullWidth
          value={mpc.n_ind}
          onChange={(e) =>
            updateSimConfigMPC({ n_ind: Number(e.target.value) })
          }
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
          onChange={(e) => updateSimConfigMPC({ dt: Number(e.target.value) })}
        />
        <TextField
          label="d_dist (m)"
          type="number"
          size="small"
          fullWidth
          inputProps={{ step: 0.1 }}
          value={mpc.d_dist}
          onChange={(e) =>
            updateSimConfigMPC({ d_dist: Number(e.target.value) })
          }
        />
      </Stack>
      <TextField
        label="du_res"
        type="number"
        size="small"
        sx={{ width: '48%' }}
        inputProps={{ step: 0.05 }}
        value={mpc.du_res}
        onChange={(e) => updateSimConfigMPC({ du_res: Number(e.target.value) })}
      />

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
            onChange={(e) => {
              const Qf = [...mpc.Qf] as [number, number, number, number];
              Qf[idx] = Number(e.target.value);
              updateSimConfigMPC({ Qf });
            }}
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
            onChange={(e) => {
              const R = [...mpc.R] as [number, number];
              R[idx] = Number(e.target.value);
              updateSimConfigMPC({ R });
            }}
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
            onChange={(e) => {
              const Rd = [...mpc.Rd] as [number, number];
              Rd[idx] = Number(e.target.value);
              updateSimConfigMPC({ Rd });
            }}
          />
        ))}
      </Stack>

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
          onChange={(e) => updateSimConfigMPC({ RF: Number(e.target.value) })}
        />
        <TextField
          label="RB (m)"
          type="number"
          size="small"
          fullWidth
          inputProps={{ step: 0.1 }}
          value={mpc.RB}
          onChange={(e) => updateSimConfigMPC({ RB: Number(e.target.value) })}
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
          onChange={(e) => updateSimConfigMPC({ W: Number(e.target.value) })}
        />
        <TextField
          label="wd_ratio"
          type="number"
          size="small"
          fullWidth
          inputProps={{ step: 0.05 }}
          value={mpc.wd_ratio}
          onChange={(e) =>
            updateSimConfigMPC({ wd_ratio: Number(e.target.value) })
          }
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
          onChange={(e) => updateSimConfigMPC({ WB: Number(e.target.value) })}
        />
        <TextField
          label="TR (m)"
          type="number"
          size="small"
          fullWidth
          inputProps={{ step: 0.01 }}
          value={mpc.TR}
          onChange={(e) => updateSimConfigMPC({ TR: Number(e.target.value) })}
        />
      </Stack>
      <TextField
        label="TW (m)"
        type="number"
        size="small"
        sx={{ width: '48%' }}
        inputProps={{ step: 0.05 }}
        value={mpc.TW}
        onChange={(e) => updateSimConfigMPC({ TW: Number(e.target.value) })}
      />

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
            updateSimConfigMPC({ steer_deg: Number(e.target.value) })
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
            updateSimConfigMPC({ steer_change_deg: Number(e.target.value) })
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
            updateSimConfigMPC({ speed_max_kph: Number(e.target.value) })
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
            updateSimConfigMPC({ speed_min_kph: Number(e.target.value) })
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
          updateSimConfigMPC({ acceleration_max: Number(e.target.value) })
        }
      />
    </Stack>
  );
}
