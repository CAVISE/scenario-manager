import {
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { NumField } from '../fields/NumField';
import OpenCDACollapsibleSection from '../../../OpenCDACollapsibleSection';
import type { ControllerPidSectionProps } from '../opencda.types';

export const ControllerPIDSection = ({
  controller,
  patch,
}: ControllerPidSectionProps) => (
  <OpenCDACollapsibleSection title="controller (pid_controller)">
    <Stack spacing={1}>
      <TextField
        label="type"
        size="small"
        fullWidth
        value={controller.type ?? ''}
        onChange={(e) => patch({ type: e.target.value })}
      />

      <Typography variant="caption">lat PID</Typography>
      <Stack direction="row" spacing={1}>
        <NumField
          label="k_p"
          value={controller.lat_k_p ?? 0}
          onChange={(v) => patch({ lat_k_p: v })}
          step={0.01}
          min={0}
        />
        <NumField
          label="k_d"
          value={controller.lat_k_d ?? 0}
          onChange={(v) => patch({ lat_k_d: v })}
          step={0.01}
          min={0}
        />
        <NumField
          label="k_i"
          value={controller.lat_k_i ?? 0}
          onChange={(v) => patch({ lat_k_i: v })}
          step={0.01}
          min={0}
        />
      </Stack>

      <Typography variant="caption">lon PID</Typography>
      <Stack direction="row" spacing={1}>
        <NumField
          label="k_p"
          value={controller.lon_k_p ?? 0}
          onChange={(v) => patch({ lon_k_p: v })}
          step={0.01}
          min={0}
        />
        <NumField
          label="k_d"
          value={controller.lon_k_d ?? 0}
          onChange={(v) => patch({ lon_k_d: v })}
          step={0.01}
          min={0}
        />
        <NumField
          label="k_i"
          value={controller.lon_k_i ?? 0}
          onChange={(v) => patch({ lon_k_i: v })}
          step={0.01}
          min={0}
        />
      </Stack>

      <FormControlLabel
        control={
          <Switch
            size="small"
            checked={controller.dynamic ?? false}
            onChange={(e) => patch({ dynamic: e.target.checked })}
          />
        }
        label="dynamic"
      />

      <Stack direction="row" spacing={1}>
        <NumField
          label="max_brake"
          value={controller.max_brake ?? 0}
          onChange={(v) => patch({ max_brake: v })}
          step={0.01}
          min={0}
        />
        <NumField
          label="max_throttle"
          value={controller.max_throttle ?? 0}
          onChange={(v) => patch({ max_throttle: v })}
          step={0.01}
          min={0}
        />
        <NumField
          label="max_steering"
          value={controller.max_steering ?? 0}
          onChange={(v) => patch({ max_steering: v })}
          step={0.01}
          min={0}
        />
      </Stack>
    </Stack>
  </OpenCDACollapsibleSection>
);
