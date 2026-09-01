import { FormControlLabel, Stack, Switch } from '@mui/material';
import { NumField } from '../rareComponents/NumField';
import OpenCDACollapsibleSection from '@sim-config/components/OpenCDACollapsibleSection';
import { SimulationConfig } from '@/store';

type Props = {
  platoonBase: Partial<SimulationConfig['opencda']['platoon_base']>;
  patch: (p: Partial<SimulationConfig['opencda']['platoon_base']>) => void;
};

export const PlatoonBaseSection = ({ platoonBase, patch }: Props) => {
  const leaderSpeedsProfile = platoonBase.leader_speeds_profile ?? [0, 0];

  return (
    <OpenCDACollapsibleSection title="platoon_base">
      <Stack spacing={1}>
        <NumField
          label="max_capacity"
          value={platoonBase.max_capacity ?? 1}
          onChange={(v) => patch({ max_capacity: v })}
          min={1}
        />
        <NumField
          label="inter_gap"
          value={platoonBase.inter_gap ?? 0}
          onChange={(v) => patch({ inter_gap: v })}
          step={0.1}
          min={0}
        />
        <NumField
          label="open_gap"
          value={platoonBase.open_gap ?? 0}
          onChange={(v) => patch({ open_gap: v })}
          step={0.1}
          min={0}
        />
        <NumField
          label="warm_up_speed"
          value={platoonBase.warm_up_speed ?? 0}
          onChange={(v) => patch({ warm_up_speed: v })}
          min={0}
        />
        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={platoonBase.change_leader_speed ?? false}
              onChange={(e) => patch({ change_leader_speed: e.target.checked })}
            />
          }
          label="change_leader_speed"
        />
        <NumField
          label="stage_duration"
          value={platoonBase.stage_duration ?? 0}
          onChange={(v) => patch({ stage_duration: v })}
          min={0}
        />
        <Stack direction="row" spacing={1}>
          <NumField
            label="leader speed 1"
            value={leaderSpeedsProfile[0] ?? 0}
            onChange={(v) =>
              patch({
                leader_speeds_profile: [v, leaderSpeedsProfile[1] ?? 0],
              })
            }
            min={0}
          />
          <NumField
            label="leader speed 2"
            value={leaderSpeedsProfile[1] ?? 0}
            onChange={(v) =>
              patch({
                leader_speeds_profile: [leaderSpeedsProfile[0] ?? 0, v],
              })
            }
            min={0}
          />
        </Stack>
        <NumField
          label="metric_time_gap_warmup"
          value={platoonBase.metric_time_gap_warmup ?? 0}
          onChange={(v) => patch({ metric_time_gap_warmup: v })}
          min={0}
        />
        <NumField
          label="metric_distance_gap_warmup"
          value={platoonBase.metric_distance_gap_warmup ?? 0}
          onChange={(v) => patch({ metric_distance_gap_warmup: v })}
          min={0}
        />
      </Stack>
    </OpenCDACollapsibleSection>
  );
};
