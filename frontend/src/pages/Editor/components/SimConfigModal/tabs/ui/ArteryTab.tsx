import {
  Divider,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { useEditorStore } from '../../../../../../store';
export default function ArteryTab() {
  const simConfig = useEditorStore((s) => s.simConfig);
  const updateSimConfigArtery = useEditorStore((s) => s.updateSimConfigArtery);
  return (
    <Stack spacing={2}>
      <Typography variant="subtitle2" color="text.secondary">
        SUMO
      </Typography>
      <TextField
        label="SUMO Config (.sumocfg)"
        size="small"
        fullWidth
        value={simConfig.artery.sumo_config}
        onChange={(e) => updateSimConfigArtery({ sumo_config: e.target.value })}
      />
      <Stack direction="row" spacing={2}>
        <TextField
          label="Step Length (s)"
          type="number"
          size="small"
          fullWidth
          inputProps={{ step: 0.01 }}
          value={simConfig.artery.sumo_step_length}
          onChange={(e) =>
            updateSimConfigArtery({ sumo_step_length: Number(e.target.value) })
          }
        />
        <TextField
          label="Seed"
          type="number"
          size="small"
          fullWidth
          value={simConfig.artery.sumo_seed}
          onChange={(e) =>
            updateSimConfigArtery({ sumo_seed: Number(e.target.value) })
          }
        />
      </Stack>
      <Divider />
      <Typography variant="subtitle2" color="text.secondary">
        Middleware (Vehicles)
      </Typography>
      <Stack direction="row" spacing={2}>
        <TextField
          label="Update Interval (ms)"
          type="number"
          size="small"
          fullWidth
          value={simConfig.artery.middleware_update_interval}
          onChange={(e) =>
            updateSimConfigArtery({
              middleware_update_interval: Number(e.target.value),
            })
          }
        />
        <TextField
          label="Datetime"
          size="small"
          fullWidth
          value={simConfig.artery.datetime}
          onChange={(e) => updateSimConfigArtery({ datetime: e.target.value })}
        />
      </Stack>
      <Stack direction="row" spacing={2}>
        <TextField
          label="CAM Min (ms)"
          type="number"
          size="small"
          fullWidth
          value={simConfig.artery.cam_interval_min}
          onChange={(e) =>
            updateSimConfigArtery({ cam_interval_min: Number(e.target.value) })
          }
        />
        <TextField
          label="CAM Max (ms)"
          type="number"
          size="small"
          fullWidth
          value={simConfig.artery.cam_interval_max}
          onChange={(e) =>
            updateSimConfigArtery({ cam_interval_max: Number(e.target.value) })
          }
        />
      </Stack>
      <Stack direction="row" gap={1}>
        <FormControlLabel
          control={
            <Switch
              checked={simConfig.artery.denm_enabled}
              onChange={(e) =>
                updateSimConfigArtery({ denm_enabled: e.target.checked })
              }
            />
          }
          label="DENM"
        />
        <FormControlLabel
          control={
            <Switch
              checked={simConfig.artery.cp_service_enabled}
              onChange={(e) =>
                updateSimConfigArtery({ cp_service_enabled: e.target.checked })
              }
            />
          }
          label="CP Service"
        />
      </Stack>
      <Divider />
      <Typography variant="subtitle2" color="text.secondary">
        RSU Services
      </Typography>
      <Stack direction="row" gap={1}>
        <FormControlLabel
          control={
            <Switch
              checked={simConfig.artery.rsu_cam_enabled}
              onChange={(e) =>
                updateSimConfigArtery({ rsu_cam_enabled: e.target.checked })
              }
            />
          }
          label="CAM"
        />
        <FormControlLabel
          control={
            <Switch
              checked={simConfig.artery.rsu_denm_enabled}
              onChange={(e) =>
                updateSimConfigArtery({ rsu_denm_enabled: e.target.checked })
              }
            />
          }
          label="DENM"
        />
      </Stack>
    </Stack>
  );
}
