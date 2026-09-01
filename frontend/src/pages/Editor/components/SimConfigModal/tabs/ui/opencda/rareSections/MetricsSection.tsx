import { Stack } from '@mui/material';
import { NumField } from '../rareComponents/NumField';
import OpenCDACollapsibleSection from '@sim-config/components/OpenCDACollapsibleSection';

type Props = {
  metrics: Partial<{
    localization_trace_warmup: number;
    behavior_speed_warmup: number;
    behavior_acceleration_warmup: number;
    behavior_ttc_warmup: number;
    behavior_hard_brake_warmup: number;
  }>;
  patch: (
    p: Partial<{
      localization_trace_warmup: number;
      behavior_speed_warmup: number;
      behavior_acceleration_warmup: number;
      behavior_ttc_warmup: number;
      behavior_hard_brake_warmup: number;
    }>
  ) => void;
};

export const MetricsSection = ({ metrics, patch }: Props) => (
  <OpenCDACollapsibleSection title="metrics (warmup_steps)">
    <Stack spacing={1}>
      <NumField
        label="localization trace"
        value={metrics.localization_trace_warmup ?? 0}
        onChange={(v) => patch({ localization_trace_warmup: v })}
        min={0}
      />
      <NumField
        label="behavior speed"
        value={metrics.behavior_speed_warmup ?? 0}
        onChange={(v) => patch({ behavior_speed_warmup: v })}
        min={0}
      />
      <NumField
        label="behavior acceleration"
        value={metrics.behavior_acceleration_warmup ?? 0}
        onChange={(v) => patch({ behavior_acceleration_warmup: v })}
        min={0}
      />
      <NumField
        label="behavior ttc"
        value={metrics.behavior_ttc_warmup ?? 0}
        onChange={(v) => patch({ behavior_ttc_warmup: v })}
        min={0}
      />
      <NumField
        label="behavior hard_brake"
        value={metrics.behavior_hard_brake_warmup ?? 0}
        onChange={(v) => patch({ behavior_hard_brake_warmup: v })}
        min={0}
      />
    </Stack>
  </OpenCDACollapsibleSection>
);
