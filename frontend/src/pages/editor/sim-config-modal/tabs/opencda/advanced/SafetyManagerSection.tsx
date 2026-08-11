import { FormControlLabel, Stack, Switch } from '@mui/material';
import OpenCDACollapsibleSection from '../../../OpenCDACollapsibleSection';
import { NumField } from '../fields/NumField';
import type { SafetyManagerSectionProps } from '../opencda.types';

export const SafetyManagerSection = ({
  safetyManager,
  patch,
}: SafetyManagerSectionProps) => (
  <OpenCDACollapsibleSection title="safety_manager">
    <Stack spacing={1}>
      <FormControlLabel
        control={
          <Switch
            size="small"
            checked={safetyManager.print_message ?? false}
            onChange={(e) => patch({ print_message: e.target.checked })}
          />
        }
        label="print_message"
      />
      <NumField
        label="collision history_size"
        value={safetyManager.collision_history_size ?? 1}
        onChange={(v) => patch({ collision_history_size: v })}
        min={1}
      />
      <NumField
        label="collision col_thresh"
        value={safetyManager.collision_col_thresh ?? 0}
        onChange={(v) => patch({ collision_col_thresh: v })}
        step={0.01}
        min={0}
      />
      <NumField
        label="stuck len_thresh"
        value={safetyManager.stuck_len_thresh ?? 0}
        onChange={(v) => patch({ stuck_len_thresh: v })}
        min={0}
      />
      <NumField
        label="stuck speed_thresh"
        value={safetyManager.stuck_speed_thresh ?? 0}
        onChange={(v) => patch({ stuck_speed_thresh: v })}
        step={0.01}
        min={0}
      />
      <NumField
        label="traffic_light light_dist_thresh"
        value={safetyManager.traffic_light_dist_thresh ?? 0}
        onChange={(v) => patch({ traffic_light_dist_thresh: v })}
        min={0}
      />
    </Stack>
  </OpenCDACollapsibleSection>
);
