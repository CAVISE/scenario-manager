import {
  Box,
  Divider,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { numInputSlot } from '../../../../../components/RightPanel/types/PanelTypes';
import type { SimulationConfig } from '../../../../Generators/types/configGeneratorsTypes';
import OpenCDACollapsibleSection from '../../components/OpenCDACollapsibleSection';
import {
  opencdaPanelPaperSx,
  opencdaSectionLabelSx,
} from '../../opencdaUiStyles';

type Oc = SimulationConfig['opencda'];

type Props = {
  oc: Oc;
  update: (patch: Partial<Oc>) => void;
};

function NumField({
  label,
  value,
  onChange,
  step,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
}) {
  return (
    <TextField
      key={label}
      label={label}
      type="number"
      size="small"
      fullWidth
      inputProps={{ ...numInputSlot.input, step: String(step ?? 1) }}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  );
}

function RgbTriple({
  label,
  value,
  onChange,
}: {
  label: string;
  value: [number, number, number];
  onChange: (v: [number, number, number]) => void;
}) {
  return (
    <Stack spacing={0.5}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Stack direction="row" spacing={1}>
        {([0, 1, 2] as const).map((i) => (
          <TextField
            key={i}
            label={['R', 'G', 'B'][i]}
            type="number"
            size="small"
            inputProps={numInputSlot.input}
            sx={{ width: 72 }}
            value={value[i]}
            onChange={(e) => {
              const n = Math.max(0, Math.min(255, Number(e.target.value) || 0));
              const next = [...value] as [number, number, number];
              next[i] = n;
              onChange(next);
            }}
          />
        ))}
      </Stack>
    </Stack>
  );
}

export default function OpenCDATabRareSections({ oc, update }: Props) {
  const patchMm = (p: Partial<Oc['map_manager']>) =>
    update({ map_manager: { ...oc.map_manager, ...p } });
  const patchSm = (p: Partial<Oc['safety_manager']>) =>
    update({ safety_manager: { ...oc.safety_manager, ...p } });
  const patchCtrl = (p: Partial<Oc['controller_pid']>) =>
    update({ controller_pid: { ...oc.controller_pid, ...p } });
  const patchPb = (p: Partial<Oc['platoon_base']>) =>
    update({ platoon_base: { ...oc.platoon_base, ...p } });
  const patchMet = (p: Partial<Oc['metrics']>) =>
    update({ metrics: { ...oc.metrics, ...p } });
  const patchCp = (p: Partial<Oc['coop_perception']>) =>
    update({ coop_perception: { ...oc.coop_perception, ...p } });
  const patchGnss = (p: Partial<Oc['gnss_noise']>) =>
    update({ gnss_noise: { ...oc.gnss_noise, ...p } });

  return (
    <Stack spacing={1.5}>
      <Divider sx={{ my: 0.5 }} />
      <Box sx={opencdaPanelPaperSx}>
        <Typography sx={opencdaSectionLabelSx}>
          Advanced / optional YAML
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          display="block"
          sx={{ mt: 0.5 }}
        >
          Rare blocks used in scenario_testing configs — expand only what you
          need.
        </Typography>
      </Box>

      <OpenCDACollapsibleSection title="Export toggles">
        <Stack spacing={0.5}>
          {(
            [
              ['export_attacks', 'attacks: []'],
              ['export_platoon_base', 'platoon_base + empty platoon_list'],
              ['export_metrics', 'localization/behavior metrics'],
              [
                'export_coop_perception',
                'cooperative_perception_visualization',
              ],
              [
                'export_vehicle_behavior_services',
                'vehicle_base behavior_services',
              ],
              ['export_world_client_host', 'world.client_host'],
            ] as const
          ).map(([key, label]) => (
            <FormControlLabel
              key={key}
              control={
                <Switch
                  key={key}
                  size="small"
                  checked={oc[key]}
                  onChange={(e) => update({ [key]: e.target.checked })}
                />
              }
              label={label}
            />
          ))}
        </Stack>
      </OpenCDACollapsibleSection>

      <OpenCDACollapsibleSection title="GNSS & localization debug">
        <Stack spacing={1}>
          <NumField
            label="heading_direction_stddev"
            value={oc.gnss_noise.heading_direction_stddev}
            onChange={(v) => patchGnss({ heading_direction_stddev: v })}
            step={0.01}
          />
          <NumField
            label="speed_stddev"
            value={oc.gnss_noise.speed_stddev}
            onChange={(v) => patchGnss({ speed_stddev: v })}
            step={0.01}
          />
          <NumField
            label="debug_helper.x_scale"
            value={oc.localization_debug_x_scale}
            onChange={(v) => update({ localization_debug_x_scale: v })}
          />
          <NumField
            label="debug_helper.y_scale"
            value={oc.localization_debug_y_scale}
            onChange={(v) => update({ localization_debug_y_scale: v })}
          />
        </Stack>
      </OpenCDACollapsibleSection>

      <OpenCDACollapsibleSection title="map_manager">
        <Stack spacing={1}>
          <NumField
            label="pixels_per_meter"
            value={oc.map_manager.pixels_per_meter}
            onChange={(v) => patchMm({ pixels_per_meter: v })}
          />
          <Stack direction="row" spacing={1}>
            <NumField
              label="raster W"
              value={oc.map_manager.raster_size[0]}
              onChange={(v) =>
                patchMm({
                  raster_size: [v, oc.map_manager.raster_size[1]],
                })
              }
            />
            <NumField
              label="raster H"
              value={oc.map_manager.raster_size[1]}
              onChange={(v) =>
                patchMm({
                  raster_size: [oc.map_manager.raster_size[0], v],
                })
              }
            />
          </Stack>
          <NumField
            label="lane_sample_resolution"
            value={oc.map_manager.lane_sample_resolution}
            onChange={(v) => patchMm({ lane_sample_resolution: v })}
            step={0.01}
          />
          <FormControlLabel
            control={
              <Switch
                key={`activate-${oc.map_manager.activate}`}
                size="small"
                checked={oc.map_manager.activate}
                onChange={(e) => patchMm({ activate: e.target.checked })}
              />
            }
            label="activate"
          />
          <FormControlLabel
            control={
              <Switch
                key={`visualize-${oc.map_manager.visualize}`}
                size="small"
                checked={oc.map_manager.visualize}
                onChange={(e) => patchMm({ visualize: e.target.checked })}
              />
            }
            label="visualize"
          />
        </Stack>
      </OpenCDACollapsibleSection>

      <OpenCDACollapsibleSection title="safety_manager">
        <Stack spacing={1}>
          <FormControlLabel
            control={
              <Switch
                key={`print_message-${oc.safety_manager.print_message}`}
                size="small"
                checked={oc.safety_manager.print_message}
                onChange={(e) => patchSm({ print_message: e.target.checked })}
              />
            }
            label="print_message"
          />
          <NumField
            label="collision history_size"
            value={oc.safety_manager.collision_history_size}
            onChange={(v) => patchSm({ collision_history_size: v })}
          />
          <NumField
            label="collision col_thresh"
            value={oc.safety_manager.collision_col_thresh}
            onChange={(v) => patchSm({ collision_col_thresh: v })}
            step={0.01}
          />
          <NumField
            label="stuck len_thresh"
            value={oc.safety_manager.stuck_len_thresh}
            onChange={(v) => patchSm({ stuck_len_thresh: v })}
          />
          <NumField
            label="stuck speed_thresh"
            value={oc.safety_manager.stuck_speed_thresh}
            onChange={(v) => patchSm({ stuck_speed_thresh: v })}
            step={0.01}
          />
          <NumField
            label="traffic_light light_dist_thresh"
            value={oc.safety_manager.traffic_light_dist_thresh}
            onChange={(v) => patchSm({ traffic_light_dist_thresh: v })}
          />
        </Stack>
      </OpenCDACollapsibleSection>

      <OpenCDACollapsibleSection title="controller (pid_controller)">
        <Stack spacing={1}>
          <TextField
            key={`type-${oc.controller_pid.type}`}
            label="type"
            size="small"
            fullWidth
            value={oc.controller_pid.type}
            onChange={(e) => patchCtrl({ type: e.target.value })}
          />
          <Typography variant="caption">lat PID</Typography>
          <Stack direction="row" spacing={1}>
            <NumField
              label="k_p"
              value={oc.controller_pid.lat_k_p}
              onChange={(v) => patchCtrl({ lat_k_p: v })}
              step={0.01}
            />
            <NumField
              label="k_d"
              value={oc.controller_pid.lat_k_d}
              onChange={(v) => patchCtrl({ lat_k_d: v })}
              step={0.01}
            />
            <NumField
              label="k_i"
              value={oc.controller_pid.lat_k_i}
              onChange={(v) => patchCtrl({ lat_k_i: v })}
              step={0.01}
            />
          </Stack>
          <Typography variant="caption">lon PID</Typography>
          <Stack direction="row" spacing={1}>
            <NumField
              label="k_p"
              value={oc.controller_pid.lon_k_p}
              onChange={(v) => patchCtrl({ lon_k_p: v })}
              step={0.01}
            />
            <NumField
              label="k_d"
              value={oc.controller_pid.lon_k_d}
              onChange={(v) => patchCtrl({ lon_k_d: v })}
              step={0.01}
            />
            <NumField
              label="k_i"
              value={oc.controller_pid.lon_k_i}
              onChange={(v) => patchCtrl({ lon_k_i: v })}
              step={0.01}
            />
          </Stack>
          <FormControlLabel
            control={
              <Switch
                key={`dynamic-${oc.controller_pid.dynamic}`}
                size="small"
                checked={oc.controller_pid.dynamic}
                onChange={(e) => patchCtrl({ dynamic: e.target.checked })}
              />
            }
            label="dynamic"
          />
          <Stack direction="row" spacing={1}>
            <NumField
              label="max_brake"
              value={oc.controller_pid.max_brake}
              onChange={(v) => patchCtrl({ max_brake: v })}
              step={0.01}
            />
            <NumField
              label="max_throttle"
              value={oc.controller_pid.max_throttle}
              onChange={(v) => patchCtrl({ max_throttle: v })}
              step={0.01}
            />
            <NumField
              label="max_steering"
              value={oc.controller_pid.max_steering}
              onChange={(v) => patchCtrl({ max_steering: v })}
              step={0.01}
            />
          </Stack>
        </Stack>
      </OpenCDACollapsibleSection>

      <OpenCDACollapsibleSection title="platoon_base">
        <Stack spacing={1}>
          <NumField
            label="max_capacity"
            value={oc.platoon_base.max_capacity}
            onChange={(v) => patchPb({ max_capacity: v })}
          />
          <NumField
            label="inter_gap"
            value={oc.platoon_base.inter_gap}
            onChange={(v) => patchPb({ inter_gap: v })}
            step={0.1}
          />
          <NumField
            label="open_gap"
            value={oc.platoon_base.open_gap}
            onChange={(v) => patchPb({ open_gap: v })}
            step={0.1}
          />
          <NumField
            label="warm_up_speed"
            value={oc.platoon_base.warm_up_speed}
            onChange={(v) => patchPb({ warm_up_speed: v })}
          />
          <FormControlLabel
            control={
              <Switch
                key={`change_leader_speed-${oc.platoon_base.change_leader_speed}`}
                size="small"
                checked={oc.platoon_base.change_leader_speed}
                onChange={(e) =>
                  patchPb({ change_leader_speed: e.target.checked })
                }
              />
            }
            label="change_leader_speed"
          />
          <NumField
            label="stage_duration"
            value={oc.platoon_base.stage_duration}
            onChange={(v) => patchPb({ stage_duration: v })}
          />
          <Stack direction="row" spacing={1}>
            <NumField
              label="leader speed 1"
              value={oc.platoon_base.leader_speeds_profile[0]}
              onChange={(v) =>
                patchPb({
                  leader_speeds_profile: [
                    v,
                    oc.platoon_base.leader_speeds_profile[1],
                  ],
                })
              }
            />
            <NumField
              label="leader speed 2"
              value={oc.platoon_base.leader_speeds_profile[1]}
              onChange={(v) =>
                patchPb({
                  leader_speeds_profile: [
                    oc.platoon_base.leader_speeds_profile[0],
                    v,
                  ],
                })
              }
            />
          </Stack>
          <NumField
            label="metric_time_gap_warmup"
            value={oc.platoon_base.metric_time_gap_warmup}
            onChange={(v) => patchPb({ metric_time_gap_warmup: v })}
          />
          <NumField
            label="metric_distance_gap_warmup"
            value={oc.platoon_base.metric_distance_gap_warmup}
            onChange={(v) => patchPb({ metric_distance_gap_warmup: v })}
          />
        </Stack>
      </OpenCDACollapsibleSection>

      <OpenCDACollapsibleSection title="metrics (warmup_steps)">
        <Stack spacing={1}>
          <NumField
            label="localization trace"
            value={oc.metrics.localization_trace_warmup}
            onChange={(v) => patchMet({ localization_trace_warmup: v })}
          />
          <NumField
            label="behavior speed"
            value={oc.metrics.behavior_speed_warmup}
            onChange={(v) => patchMet({ behavior_speed_warmup: v })}
          />
          <NumField
            label="behavior acceleration"
            value={oc.metrics.behavior_acceleration_warmup}
            onChange={(v) => patchMet({ behavior_acceleration_warmup: v })}
          />
          <NumField
            label="behavior ttc"
            value={oc.metrics.behavior_ttc_warmup}
            onChange={(v) => patchMet({ behavior_ttc_warmup: v })}
          />
          <NumField
            label="behavior hard_brake"
            value={oc.metrics.behavior_hard_brake_warmup}
            onChange={(v) => patchMet({ behavior_hard_brake_warmup: v })}
          />
        </Stack>
      </OpenCDACollapsibleSection>

      <OpenCDACollapsibleSection title="cooperative_perception_visualization">
        <Stack spacing={1}>
          <RgbTriple
            label="background"
            value={oc.coop_perception.background}
            onChange={(v) => patchCp({ background: v })}
          />
          <NumField
            label="bbox_line_thickness"
            value={oc.coop_perception.bbox_line_thickness}
            onChange={(v) => patchCp({ bbox_line_thickness: v })}
          />
          <NumField
            label="image_dpi"
            value={oc.coop_perception.image_dpi}
            onChange={(v) => patchCp({ image_dpi: v })}
          />
        </Stack>
      </OpenCDACollapsibleSection>

      <OpenCDACollapsibleSection title="carla_traffic_manager (extra %)">
        <Stack spacing={1}>
          <NumField
            label="ignore_vehicles_percentage"
            value={oc.ignore_vehicles_percentage}
            onChange={(v) => update({ ignore_vehicles_percentage: v })}
          />
          <NumField
            label="random_left_lanechange_percentage"
            value={oc.random_left_lanechange_percentage}
            onChange={(v) => update({ random_left_lanechange_percentage: v })}
          />
          <NumField
            label="random_right_lanechange_percentage"
            value={oc.random_right_lanechange_percentage}
            onChange={(v) => update({ random_right_lanechange_percentage: v })}
          />
        </Stack>
      </OpenCDACollapsibleSection>

      <OpenCDACollapsibleSection title="vehicle_base behavior_services (global)">
        <Stack spacing={0.5}>
          <FormControlLabel
            control={
              <Switch
                key={`lane_change_controller-${oc.vehicle_behavior_services.self_informer}`}
                size="small"
                checked={oc.vehicle_behavior_services.self_informer}
                onChange={(e) =>
                  update({
                    vehicle_behavior_services: {
                      ...oc.vehicle_behavior_services,
                      self_informer: e.target.checked,
                    },
                  })
                }
              />
            }
            label="self_informer"
          />
          <FormControlLabel
            control={
              <Switch
                key={`movement_controller-${oc.vehicle_behavior_services.movement_controller}`}
                size="small"
                checked={oc.vehicle_behavior_services.movement_controller}
                onChange={(e) =>
                  update({
                    vehicle_behavior_services: {
                      ...oc.vehicle_behavior_services,
                      movement_controller: e.target.checked,
                    },
                  })
                }
              />
            }
            label="movement_controller"
          />
        </Stack>
      </OpenCDACollapsibleSection>

      {oc.export_world_client_host && (
        <TextField
          key={`world_client_host-${oc.world_client_host}`}
          label="world.client_host"
          size="small"
          fullWidth
          value={oc.world_client_host}
          onChange={(e) => update({ world_client_host: e.target.value })}
        />
      )}
    </Stack>
  );
}
