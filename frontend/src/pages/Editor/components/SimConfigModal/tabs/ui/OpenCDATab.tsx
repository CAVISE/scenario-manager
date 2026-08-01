import {
  Box,
  Button,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { numInputSlot } from '../../../../../components/RightPanel/types/PanelTypes';
import {
  opencdaPanelPaperSx,
  opencdaSectionLabelSx,
} from '../../opencdaUiStyles';
import { useEditorStore } from '../../../../../../store';
import { AIM_CHECK_SIM_OVERRIDES } from '../../../../Generators/exporters/aimCheckDefaults';
import {
  defaultSimConfig,
  mergeSimConfigWithDefaults,
} from '../../../../Generators/types/configGeneratorsTypes';
import OpenCDATabRareSections from './OpenCDATabRareSections';

export default function OpenCDATab() {
  const simConfig = mergeSimConfigWithDefaults(
    useEditorStore((s) => s.simConfig),
  );
  const updateSimConfigOpenCDA = useEditorStore(
    (s) => s.updateSimConfigOpenCDA,
  );
  const updateSimConfig = useEditorStore((s) => s.updateSimConfig);
  const oc = simConfig.opencda ?? defaultSimConfig.opencda;
  const baseColor = oc.vehicle_base_color ?? [122, 156, 111];

  const applyAimCheckDefaults = () => {
    const aimOc = AIM_CHECK_SIM_OVERRIDES.opencda!;
    updateSimConfig({
      carla: {
        ...simConfig.carla,
        map: AIM_CHECK_SIM_OVERRIDES.carla?.map ?? simConfig.carla.map,
      },
    });
    updateSimConfigOpenCDA({
      ...aimOc,
      bp_class_sample_prob: {
        ...oc.bp_class_sample_prob,
        ...aimOc.bp_class_sample_prob,
      },
      local_planner: { ...oc.local_planner, ...aimOc.local_planner },
      lidar_sim: { ...oc.lidar_sim, ...aimOc.lidar_sim },
      gnss_noise: { ...oc.gnss_noise, ...aimOc.gnss_noise },
    });
  };

  return (
    <Stack spacing={2}>
      <Box sx={opencdaPanelPaperSx}>
        <Typography sx={{ ...opencdaSectionLabelSx, mb: 1.5 }}>
          Export profile
        </Typography>
        <Stack spacing={1.5}>
          <FormControl size="small" fullWidth>
            <FormLabel>Configuration profile</FormLabel>
            <Select
              key={`export_profile-${oc.export_profile}`}
              value={oc.export_profile}
              onChange={(e) =>
                updateSimConfigOpenCDA({
                  export_profile: e.target.value as 'standard' | 'aim_check',
                })
              }
            >
              <MenuItem value="standard">Standard</MenuItem>
              <MenuItem value="aim_check">AIM check</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            size="small"
            onClick={applyAimCheckDefaults}
            sx={{ alignSelf: 'flex-start' }}
          >
            Load AIM check defaults
          </Button>
        </Stack>
      </Box>

      <FormControlLabel
        control={
          <Switch
            key={`vehicle_base_color-${oc.vehicle_base_color}`}
            checked={oc.vehicle_base_color != null}
            onChange={(e) =>
              updateSimConfigOpenCDA({
                vehicle_base_color: e.target.checked
                  ? ([122, 156, 111] as [number, number, number])
                  : undefined,
              })
            }
          />
        }
        label="vehicle_base.behavior.color (RGB)"
      />
      {oc.vehicle_base_color && (
        <Stack direction="row" spacing={1}>
          {([0, 1, 2] as const).map((idx) => (
            <TextField
              key={idx}
              label={['R', 'G', 'B'][idx]}
              type="number"
              size="small"
              inputProps={numInputSlot.input}
              value={baseColor[idx]}
              onChange={(e) => {
                const val = Math.max(
                  0,
                  Math.min(255, Number(e.target.value) || 0),
                );
                const next = [...baseColor] as [number, number, number];
                next[idx] = val;
                updateSimConfigOpenCDA({ vehicle_base_color: next });
              }}
              sx={{ width: 72 }}
            />
          ))}
        </Stack>
      )}

      <Divider />

      <Typography variant="subtitle2" color="text.secondary">
        Blueprint
      </Typography>
      <FormControlLabel
        control={
          <Switch
            key={`use_multi_class_bp-${oc.use_multi_class_bp}`}
            checked={oc.use_multi_class_bp}
            onChange={(e) =>
              updateSimConfigOpenCDA({ use_multi_class_bp: e.target.checked })
            }
          />
        }
        label="Multi-class blueprints"
      />
      <TextField
        key={`bp_meta_path-${oc.bp_meta_path}`}
        label="Blueprint meta path"
        size="small"
        fullWidth
        value={oc.bp_meta_path}
        onChange={(e) =>
          updateSimConfigOpenCDA({ bp_meta_path: e.target.value })
        }
      />
      <Typography variant="caption" color="text.secondary">
        Class sample probabilities (sum ≤ 1)
      </Typography>
      <Stack direction="row" spacing={1} flexWrap="wrap">
        {(['car', 'truck', 'bus', 'bicycle', 'motorcycle'] as const).map(
          (cls) => (
            <TextField
              key={cls}
              label={cls}
              type="number"
              size="small"
              inputProps={{ ...numInputSlot.input, step: '0.05', min: '0', max: '1' }}
              value={oc.bp_class_sample_prob[cls]}
              onChange={(e) =>
                updateSimConfigOpenCDA({
                  bp_class_sample_prob: {
                    ...oc.bp_class_sample_prob,
                    [cls]: Number(e.target.value),
                  },
                })
              }
              sx={{ width: 90 }}
            />
          ),
        )}
      </Stack>

      <Divider />

      <Typography variant="subtitle2" color="text.secondary">
        Export / defaults
      </Typography>
      <Stack direction="row" spacing={2}>
        <FormControlLabel
          control={
            <Switch
              key={`v2x_enabled-${oc.v2x_enabled}`}
              checked={oc.v2x_enabled}
              onChange={(e) =>
                updateSimConfigOpenCDA({ v2x_enabled: e.target.checked })
              }
            />
          }
          label="Default V2X enabled"
        />
        <TextField
          key={`v2x_communication_range-${oc.v2x_communication_range}`}
          label="V2X range (m)"
          type="number"
          size="small"
          inputProps={numInputSlot.input}
          value={oc.v2x_communication_range}
          onChange={(e) =>
            updateSimConfigOpenCDA({
              v2x_communication_range: Number(e.target.value),
            })
          }
          sx={{ maxWidth: 140 }}
        />
        <FormControl size="small" sx={{ minWidth: 190 }}>
          <FormLabel>V2X position source</FormLabel>
          <Select
            key={`v2x_position_source-${oc.v2x_position_source}`}
            value={oc.v2x_position_source}
            onChange={(e) =>
              updateSimConfigOpenCDA({
                v2x_position_source: e.target.value as
                  | 'estimated'
                  | 'ground_truth',
              })
            }
          >
            <MenuItem value="estimated">Estimated</MenuItem>
            <MenuItem value="ground_truth">Ground truth</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      <Divider />

      <Typography variant="subtitle2" color="text.secondary">
        Vehicle behavior
      </Typography>
      <Stack direction="row" spacing={2}>
        <TextField
          key={`max_speed-${oc.max_speed}`}
          label="Max speed (km/h)"
          type="number"
          size="small"
          fullWidth
          inputProps={numInputSlot.input}
          value={oc.max_speed}
          onChange={(e) =>
            updateSimConfigOpenCDA({ max_speed: Number(e.target.value) })
          }
        />
        <TextField
          key={`tailgate_speed-${oc.tailgate_speed}`}
          label="Tailgate speed"
          type="number"
          size="small"
          fullWidth
          inputProps={numInputSlot.input}
          value={oc.tailgate_speed}
          onChange={(e) =>
            updateSimConfigOpenCDA({ tailgate_speed: Number(e.target.value) })
          }
        />
      </Stack>
      <Stack direction="row" spacing={2} key={`safety_time-${oc.safety_time}`}>
        <TextField
          key={`safety_time-${oc.safety_time}`}
          label="Safety time (s)"
          type="number"
          size="small"
          fullWidth
          inputProps={numInputSlot.input}
          value={oc.safety_time}
          onChange={(e) =>
            updateSimConfigOpenCDA({ safety_time: Number(e.target.value) })
          }
        />
        <TextField
          key={`emergency_param-${oc.emergency_param}`}
          label="Emergency param"
          type="number"
          size="small"
          fullWidth
          inputProps={{ ...numInputSlot.input, step: '0.05' }}
          value={oc.emergency_param}
          onChange={(e) =>
            updateSimConfigOpenCDA({ emergency_param: Number(e.target.value) })
          }
        />
      </Stack>
      <Stack direction="row" spacing={2}>
        <TextField
          key={`collision_time_ahead-${oc.collision_time_ahead}`}
          label="Collision ahead (s)"
          type="number"
          size="small"
          fullWidth
          value={oc.collision_time_ahead}
          onChange={(e) =>
            updateSimConfigOpenCDA({
              collision_time_ahead: Number(e.target.value),
            })
          }
        />
        <TextField
          key={`collision_time_behind-${oc.collision_time_ahead}`}
          label="Sample resolution (m)"
          type="number"
          size="small"
          fullWidth
          value={oc.sample_resolution}
          onChange={(e) =>
            updateSimConfigOpenCDA({
              sample_resolution: Number(e.target.value),
            })
          }
        />
      </Stack>
      <Stack direction="row" spacing={2}>
        <TextField
          key={`speed_lim_dist-${oc.speed_lim_dist}`}
          label="Speed lim dist (m)"
          type="number"
          size="small"
          fullWidth
          value={oc.speed_lim_dist}
          onChange={(e) =>
            updateSimConfigOpenCDA({ speed_lim_dist: Number(e.target.value) })
          }
        />
        <TextField
          key={`speed_decrease-${oc.speed_decrease}`}
          label="Speed decrease"
          type="number"
          size="small"
          fullWidth
          value={oc.speed_decrease}
          onChange={(e) =>
            updateSimConfigOpenCDA({ speed_decrease: Number(e.target.value) })
          }
        />
      </Stack>
      <TextField
        key={`overtake_counter_recover-${oc.overtake_counter_recover}`}
        label="Overtake counter recover"
        type="number"
        size="small"
        fullWidth
        value={oc.overtake_counter_recover}
        onChange={(e) =>
          updateSimConfigOpenCDA({
            overtake_counter_recover: Number(e.target.value),
          })
        }
      />
      <Stack direction="row" gap={1} flexWrap="wrap">
        <FormControlLabel
          control={
            <Switch
              key={`ignore_traffic_light-${oc.ignore_traffic_light}`}
              checked={oc.ignore_traffic_light}
              onChange={(e) =>
                updateSimConfigOpenCDA({
                  ignore_traffic_light: e.target.checked,
                })
              }
            />
          }
          label="Ignore traffic lights"
        />
        <FormControlLabel
          control={
            <Switch
              key={`overtake_allowed-${oc.overtake_allowed}`}
              checked={oc.overtake_allowed}
              onChange={(e) =>
                updateSimConfigOpenCDA({ overtake_allowed: e.target.checked })
              }
            />
          }
          label="Overtake allowed"
        />
      </Stack>

      <Divider />
      <Typography variant="subtitle2" color="text.secondary">
        Local planner
      </Typography>
      <Stack direction="row" spacing={2}>
        <TextField
          key={`local_planner-${oc.local_planner.buffer_size}`}
          label="Buffer size"
          type="number"
          size="small"
          fullWidth
          value={oc.local_planner.buffer_size}
          onChange={(e) =>
            updateSimConfigOpenCDA({
              local_planner: {
                ...oc.local_planner,
                buffer_size: Number(e.target.value),
              },
            })
          }
        />
        <TextField
          key={`trajectory_update_freq-${oc.local_planner.trajectory_update_freq}`}
          label="Traj. update freq"
          type="number"
          size="small"
          fullWidth
          value={oc.local_planner.trajectory_update_freq}
          onChange={(e) =>
            updateSimConfigOpenCDA({
              local_planner: {
                ...oc.local_planner,
                trajectory_update_freq: Number(e.target.value),
              },
            })
          }
        />
      </Stack>
      <Stack direction="row" spacing={2}>
        <TextField
          key={`waypoint_update_freq-${oc.local_planner.waypoint_update_freq}`}
          label="Waypoint update freq"
          type="number"
          size="small"
          fullWidth
          value={oc.local_planner.waypoint_update_freq}
          onChange={(e) =>
            updateSimConfigOpenCDA({
              local_planner: {
                ...oc.local_planner,
                waypoint_update_freq: Number(e.target.value),
              },
            })
          }
        />
        <TextField
          key={`min_dist-${oc.local_planner.min_dist}`}
          label="Min dist (m)"
          type="number"
          size="small"
          fullWidth
          value={oc.local_planner.min_dist}
          onChange={(e) =>
            updateSimConfigOpenCDA({
              local_planner: {
                ...oc.local_planner,
                min_dist: Number(e.target.value),
              },
            })
          }
        />
      </Stack>
      <Stack direction="row" spacing={2} alignItems="center">
        <TextField
          key={`trajectory_dt-${oc.local_planner.trajectory_dt}`}
          label="Trajectory dt (s)"
          type="number"
          size="small"
          fullWidth
          inputProps={{ step: 0.05 }}
          value={oc.local_planner.trajectory_dt}
          onChange={(e) =>
            updateSimConfigOpenCDA({
              local_planner: {
                ...oc.local_planner,
                trajectory_dt: Number(e.target.value),
              },
            })
          }
        />
        <FormControlLabel
          control={
            <Switch
              key={`debug-${oc.local_planner.debug}`}
              checked={oc.local_planner.debug}
              onChange={(e) =>
                updateSimConfigOpenCDA({
                  local_planner: {
                    ...oc.local_planner,
                    debug: e.target.checked,
                  },
                })
              }
            />
          }
          label="Debug"
        />
        <FormControlLabel
          control={
            <Switch
              key={`debug_trajectory-${oc.local_planner.debug_trajectory}`}
              checked={oc.local_planner.debug_trajectory}
              onChange={(e) =>
                updateSimConfigOpenCDA({
                  local_planner: {
                    ...oc.local_planner,
                    debug_trajectory: e.target.checked,
                  },
                })
              }
            />
          }
          label="Debug traj."
        />
      </Stack>

      <Divider />

      <Typography variant="subtitle2" color="text.secondary">
        Vehicle sensing
      </Typography>
      <Stack direction="row" spacing={2}>
        <TextField
          key={`vehicle_camera_visualize-${oc.vehicle_camera_visualize}`}
          label="Cam visualize (0/1)"
          type="number"
          size="small"
          fullWidth
          inputProps={{ min: 0, max: 1 }}
          value={oc.vehicle_camera_visualize}
          onChange={(e) =>
            updateSimConfigOpenCDA({
              vehicle_camera_visualize: Number(e.target.value),
            })
          }
        />
        <TextField
          key={`vehicle_cam_num-${oc.vehicle_cam_num}`}
          label="Onboard cameras (0–4)"
          type="number"
          size="small"
          fullWidth
          inputProps={{ min: 0, max: 4 }}
          value={oc.vehicle_cam_num}
          onChange={(e) =>
            updateSimConfigOpenCDA({ vehicle_cam_num: Number(e.target.value) })
          }
        />
      </Stack>
      <Typography variant="subtitle2" color="text.secondary" sx={{ pt: 1 }}>
        Vehicle LiDAR
      </Typography>
      <Stack direction="row" spacing={2}>
        <TextField
          key={`lidar_channels-${oc.lidar_channels}`}
          label="Channels"
          type="number"
          size="small"
          fullWidth
          value={oc.lidar_channels}
          onChange={(e) =>
            updateSimConfigOpenCDA({ lidar_channels: Number(e.target.value) })
          }
        />
        <TextField
          key={`lidar_range-${oc.lidar_range}`}
          label="Range (m)"
          type="number"
          size="small"
          fullWidth
          value={oc.lidar_range}
          onChange={(e) =>
            updateSimConfigOpenCDA({ lidar_range: Number(e.target.value) })
          }
        />
      </Stack>
      <Stack direction="row" spacing={2}>
        <TextField
          key={`lidar_points_per_second-${oc.lidar_points_per_second}`}
          label="Points / second"
          type="number"
          size="small"
          fullWidth
          value={oc.lidar_points_per_second}
          onChange={(e) =>
            updateSimConfigOpenCDA({
              lidar_points_per_second: Number(e.target.value),
            })
          }
        />
        <TextField
          key={`lidar_rotation_frequency-${oc.lidar_rotation_frequency}`}
          label="Rotation freq (Hz)"
          type="number"
          size="small"
          fullWidth
          value={oc.lidar_rotation_frequency}
          onChange={(e) =>
            updateSimConfigOpenCDA({
              lidar_rotation_frequency: Number(e.target.value),
            })
          }
        />
      </Stack>
      <Stack direction="row" spacing={2}>
        <TextField
          key={`lidar_upper_fov-${oc.lidar_upper_fov}`}
          label="Upper FOV (°)"
          type="number"
          size="small"
          fullWidth
          value={oc.lidar_upper_fov}
          onChange={(e) =>
            updateSimConfigOpenCDA({ lidar_upper_fov: Number(e.target.value) })
          }
        />
        <TextField
          key={`lidar_lower_fov-${oc.lidar_lower_fov}`}
          label="Lower FOV (°)"
          type="number"
          size="small"
          fullWidth
          value={oc.lidar_lower_fov}
          onChange={(e) =>
            updateSimConfigOpenCDA({ lidar_lower_fov: Number(e.target.value) })
          }
        />
      </Stack>
      <Stack direction="row" gap={1}>
        <FormControlLabel
          control={
            <Switch
              key={`perception_activate-${oc.perception_activate}`}
              checked={oc.perception_activate}
              onChange={(e) =>
                updateSimConfigOpenCDA({
                  perception_activate: e.target.checked,
                })
              }
            />
          }
          label="Perception"
        />
        <FormControlLabel
          control={
            <Switch
              key={`localization_activate-${oc.localization_activate}`}
              checked={oc.localization_activate}
              onChange={(e) =>
                updateSimConfigOpenCDA({
                  localization_activate: e.target.checked,
                })
              }
            />
          }
          label="Localization"
        />
        <FormControl size="small" sx={{ minWidth: 190 }}>
          <FormLabel>Navigation position</FormLabel>
          <Select
            value={oc.localization_navigation_source}
            key={`localization_navigation_source-${oc.localization_navigation_source}`}
            onChange={(e) =>
              updateSimConfigOpenCDA({
                localization_navigation_source: e.target.value as
                  | 'estimated'
                  | 'ground_truth',
              })
            }
          >
            <MenuItem value="estimated">Estimated</MenuItem>
            <MenuItem value="ground_truth">Ground truth</MenuItem>
          </Select>
        </FormControl>
        <FormControlLabel
          control={
            <Switch
              key={`lidar_visualize-${oc.lidar_visualize}`}
              checked={oc.lidar_visualize}
              onChange={(e) =>
                updateSimConfigOpenCDA({ lidar_visualize: e.target.checked })
              }
            />
          }
          label="Visualize LiDAR"
        />
      </Stack>

      <Typography variant="caption" color="text.secondary">
        LiDAR dropoff &amp; noise (vehicle + RSU)
      </Typography>
      <Stack direction="row" spacing={2}>
        <TextField
          key={`dropoff_general_rate-${oc.lidar_sim.dropoff_general_rate}`}
          label="Dropoff rate"
          type="number"
          size="small"
          fullWidth
          inputProps={{ step: 0.05 }}
          value={oc.lidar_sim.dropoff_general_rate}
          onChange={(e) =>
            updateSimConfigOpenCDA({
              lidar_sim: {
                ...oc.lidar_sim,
                dropoff_general_rate: Number(e.target.value),
              },
            })
          }
        />
        <TextField
          key={`dropoff_intensity_limit-${oc.lidar_sim.dropoff_intensity_limit}`}
          label="Intensity limit"
          type="number"
          size="small"
          fullWidth
          inputProps={{ step: 0.05 }}
          value={oc.lidar_sim.dropoff_intensity_limit}
          onChange={(e) =>
            updateSimConfigOpenCDA({
              lidar_sim: {
                ...oc.lidar_sim,
                dropoff_intensity_limit: Number(e.target.value),
              },
            })
          }
        />
      </Stack>
      <Stack direction="row" spacing={2}>
        <TextField
          key={`dropoff_zero_intensity-${oc.lidar_sim.dropoff_zero_intensity}`}
          label="Zero intensity"
          type="number"
          size="small"
          fullWidth
          inputProps={{ step: 0.05 }}
          value={oc.lidar_sim.dropoff_zero_intensity}
          onChange={(e) =>
            updateSimConfigOpenCDA({
              lidar_sim: {
                ...oc.lidar_sim,
                dropoff_zero_intensity: Number(e.target.value),
              },
            })
          }
        />
        <TextField
          key={`noise_stddev-${oc.lidar_sim.noise_stddev}`}
          label="Noise stddev"
          type="number"
          size="small"
          fullWidth
          inputProps={{ step: 0.01 }}
          value={oc.lidar_sim.noise_stddev}
          onChange={(e) =>
            updateSimConfigOpenCDA({
              lidar_sim: {
                ...oc.lidar_sim,
                noise_stddev: Number(e.target.value),
              },
            })
          }
        />
      </Stack>

      <Typography variant="subtitle2" color="text.secondary" sx={{ pt: 1 }}>
        Localization
      </Typography>
      <Typography variant="caption" color="text.secondary">
        GNSS noise (RSU block, when localization on)
      </Typography>
      <Stack direction="row" spacing={2}>
        <TextField
          key={`gnss_alt_stddev-${oc.gnss_noise.alt_stddev}`}
          label="Alt σ"
          type="number"
          size="small"
          fullWidth
          inputProps={{ step: 0.01 }}
          value={oc.gnss_noise.alt_stddev}
          onChange={(e) =>
            updateSimConfigOpenCDA({
              gnss_noise: {
                ...oc.gnss_noise,
                alt_stddev: Number(e.target.value),
              },
            })
          }
        />
        <TextField
          key={`gnss_lat_stddev-${oc.gnss_noise.lat_stddev}`}
          label="Lat σ"
          type="number"
          size="small"
          fullWidth
          inputProps={{ step: 1e-7 }}
          value={oc.gnss_noise.lat_stddev}
          onChange={(e) =>
            updateSimConfigOpenCDA({
              gnss_noise: {
                ...oc.gnss_noise,
                lat_stddev: Number(e.target.value),
              },
            })
          }
        />
        <TextField
          key={`gnss_lon_stddev-${oc.gnss_noise.lon_stddev}`}
          label="Lon σ"
          type="number"
          size="small"
          fullWidth
          inputProps={{ step: 1e-7 }}
          value={oc.gnss_noise.lon_stddev}
          onChange={(e) =>
            updateSimConfigOpenCDA({
              gnss_noise: {
                ...oc.gnss_noise,
                lon_stddev: Number(e.target.value),
              },
            })
          }
        />
      </Stack>
      <FormControlLabel
        control={
          <Switch
            key={`vehicle_localization_debug_animation-${oc.vehicle_localization_debug_animation}`}
            checked={oc.vehicle_localization_debug_animation}
            onChange={(e) =>
              updateSimConfigOpenCDA({
                vehicle_localization_debug_animation: e.target.checked,
              })
            }
          />
        }
        label="Vehicle localization debug animation"
      />

      <Divider />

      <Typography variant="subtitle2" color="text.secondary">
        RSU base
      </Typography>
      <Stack direction="row" spacing={2}>
        <TextField
          key={`rsu_lidar_channels-${oc.rsu_lidar_channels}`}
          label="LiDAR channels"
          type="number"
          size="small"
          fullWidth
          value={oc.rsu_lidar_channels}
          onChange={(e) =>
            updateSimConfigOpenCDA({
              rsu_lidar_channels: Number(e.target.value),
            })
          }
        />
        <TextField
          key={`rsu_lidar_range-${oc.rsu_lidar_range}`}
          label="LiDAR range (m)"
          type="number"
          size="small"
          fullWidth
          value={oc.rsu_lidar_range}
          onChange={(e) =>
            updateSimConfigOpenCDA({ rsu_lidar_range: Number(e.target.value) })
          }
        />
      </Stack>
      <Stack direction="row" spacing={2}>
        <TextField
          key={`rsu_camera_visualize-${oc.rsu_camera_visualize}`}
          label="RSU cam visualize (0/1)"
          type="number"
          size="small"
          fullWidth
          inputProps={{ min: 0, max: 1 }}
          value={oc.rsu_camera_visualize}
          onChange={(e) =>
            updateSimConfigOpenCDA({
              rsu_camera_visualize: Number(e.target.value),
            })
          }
        />
        <TextField
          key={`rsu_cam_num-${oc.rsu_cam_num}`}
          label="Camera count (0–4)"
          type="number"
          size="small"
          fullWidth
          inputProps={{ min: 0, max: 4 }}
          value={oc.rsu_cam_num}
          onChange={(e) =>
            updateSimConfigOpenCDA({ rsu_cam_num: Number(e.target.value) })
          }
        />
      </Stack>
      <FormControlLabel
        control={
          <Switch
            key={`rsu_perception_activate-${oc.rsu_perception_activate}`}
            checked={oc.rsu_perception_activate}
            onChange={(e) =>
              updateSimConfigOpenCDA({
                rsu_perception_activate: e.target.checked,
              })
            }
          />
        }
        label="RSU Perception"
      />

      <Divider />

      <Typography variant="subtitle2" color="text.secondary">
        SUMO co-simulation
      </Typography>
      <Stack direction="row" spacing={2}>
        <TextField
          key={`sumo_host-${oc.sumo_host}`}
          label="Host"
          size="small"
          fullWidth
          value={oc.sumo_host}
          onChange={(e) =>
            updateSimConfigOpenCDA({ sumo_host: e.target.value })
          }
        />
        <TextField
          key={`sumo_port-${oc.sumo_port}`}
          label="Port"
          type="number"
          size="small"
          fullWidth
          value={oc.sumo_port}
          onChange={(e) =>
            updateSimConfigOpenCDA({ sumo_port: Number(e.target.value) })
          }
        />
      </Stack>
      <Stack direction="row" spacing={2} alignItems="center">
        <TextField
          key={`sumo_client_order-${oc.sumo_client_order}`}
          label="Client order"
          type="number"
          size="small"
          value={oc.sumo_client_order}
          onChange={(e) =>
            updateSimConfigOpenCDA({
              sumo_client_order: Number(e.target.value),
            })
          }
          sx={{ width: 140 }}
        />
        <FormControlLabel
          control={
            <Switch
              key={`sumo_gui-${oc.sumo_gui}`}
              checked={oc.sumo_gui}
              onChange={(e) =>
                updateSimConfigOpenCDA({ sumo_gui: e.target.checked })
              }
            />
          }
          label="SUMO GUI"
        />
      </Stack>

      <Divider />

      <Typography variant="subtitle2" color="text.secondary">
        Background CARLA traffic
      </Typography>
      <FormControlLabel
        control={
          <Switch
            key={`enable_background_traffic-${oc.enable_background_traffic}`}
            checked={oc.enable_background_traffic}
            onChange={(e) =>
              updateSimConfigOpenCDA({
                enable_background_traffic: e.target.checked,
              })
            }
          />
        }
        label="Enable background traffic"
      />
      {oc.enable_background_traffic && (
        <Stack spacing={2}>
          <FormControlLabel
            control={
              <Switch
                key={`bg_traffic_random-${oc.bg_traffic_random}`}
                checked={oc.bg_traffic_random}
                onChange={(e) =>
                  updateSimConfigOpenCDA({
                    bg_traffic_random: e.target.checked,
                  })
                }
              />
            }
            label="Random spawn"
          />
          <Typography variant="caption" color="text.secondary">
            Spawn range [x_min, x_max, y_min, y_max, x_step, y_step] + vehicle
            count below
          </Typography>
          <Stack direction="row" spacing={2}>
            <TextField
              key={`bg_spawn_range.x_min-${oc.bg_spawn_range.x_min}`}
              label="X min"
              type="number"
              size="small"
              fullWidth
              value={oc.bg_spawn_range.x_min}
              onChange={(e) =>
                updateSimConfigOpenCDA({
                  bg_spawn_range: {
                    ...oc.bg_spawn_range,
                    x_min: Number(e.target.value),
                  },
                })
              }
            />
            <TextField
              key={`bg_spawn_range.x_max-${oc.bg_spawn_range.x_max}`}
              label="X max"
              type="number"
              size="small"
              fullWidth
              value={oc.bg_spawn_range.x_max}
              onChange={(e) =>
                updateSimConfigOpenCDA({
                  bg_spawn_range: {
                    ...oc.bg_spawn_range,
                    x_max: Number(e.target.value),
                  },
                })
              }
            />
          </Stack>
          <Stack direction="row" spacing={2}>
            <TextField
              key={`bg_spawn_range.y_min-${oc.bg_spawn_range.y_min}`}
              label="Y min"
              type="number"
              size="small"
              fullWidth
              value={oc.bg_spawn_range.y_min}
              onChange={(e) =>
                updateSimConfigOpenCDA({
                  bg_spawn_range: {
                    ...oc.bg_spawn_range,
                    y_min: Number(e.target.value),
                  },
                })
              }
            />
            <TextField
              key={`bg_spawn_range.y_max-${oc.bg_spawn_range.y_max}`}
              label="Y max"
              type="number"
              size="small"
              fullWidth
              value={oc.bg_spawn_range.y_max}
              onChange={(e) =>
                updateSimConfigOpenCDA({
                  bg_spawn_range: {
                    ...oc.bg_spawn_range,
                    y_max: Number(e.target.value),
                  },
                })
              }
            />
          </Stack>
          <Stack direction="row" spacing={2}>
            <TextField
              key={`bg_spawn_range.x_step-${oc.bg_spawn_range.x_step}`}
              label="X step"
              type="number"
              size="small"
              fullWidth
              value={oc.bg_spawn_range.x_step}
              onChange={(e) =>
                updateSimConfigOpenCDA({
                  bg_spawn_range: {
                    ...oc.bg_spawn_range,
                    x_step: Number(e.target.value),
                  },
                })
              }
            />
            <TextField
              key={`bg_spawn_range.y_step-${oc.bg_spawn_range.y_step}`}
              label="Y step"
              type="number"
              size="small"
              fullWidth
              value={oc.bg_spawn_range.y_step}
              onChange={(e) =>
                updateSimConfigOpenCDA({
                  bg_spawn_range: {
                    ...oc.bg_spawn_range,
                    y_step: Number(e.target.value),
                  },
                })
              }
            />
          </Stack>
          <Stack direction="row" spacing={2}>
            <TextField
              label="Speed % (−100=2x)"
              type="number"
              size="small"
              fullWidth
              value={oc.global_speed_perc}
              onChange={(e) =>
                updateSimConfigOpenCDA({
                  global_speed_perc: Number(e.target.value),
                })
              }
            />
            <TextField
              key={`bg_vehicle_num-${oc.bg_vehicle_num}`}
              label="Vehicles"
              type="number"
              size="small"
              fullWidth
              value={oc.bg_vehicle_num}
              onChange={(e) =>
                updateSimConfigOpenCDA({
                  bg_vehicle_num: Number(e.target.value),
                })
              }
            />
          </Stack>
          <Stack direction="row" spacing={2}>
            <TextField
              key={`bg_global_distance-${oc.bg_global_distance}`}
              label="Global distance (m)"
              type="number"
              size="small"
              fullWidth
              value={oc.bg_global_distance}
              onChange={(e) =>
                updateSimConfigOpenCDA({
                  bg_global_distance: Number(e.target.value),
                })
              }
            />
            <FormControlLabel
              control={
                <Switch
                  key={`bg_set_osm_mode-${oc.bg_set_osm_mode}`}
                  checked={oc.bg_set_osm_mode}
                  onChange={(e) =>
                    updateSimConfigOpenCDA({
                      bg_set_osm_mode: e.target.checked,
                    })
                  }
                />
              }
              label="OSM mode"
            />
          </Stack>
          <Stack direction="row" spacing={2}>
            <TextField
              key={`ignore_lights_percentage-${oc.ignore_lights_percentage}`}
              label="Ignore lights %"
              type="number"
              size="small"
              fullWidth
              value={oc.ignore_lights_percentage}
              onChange={(e) =>
                updateSimConfigOpenCDA({
                  ignore_lights_percentage: Number(e.target.value),
                })
              }
            />
            <TextField
              key={`bg_ignore_signs_percentage-${oc.bg_ignore_signs_percentage}`}
              label="Ignore signs %"
              type="number"
              size="small"
              fullWidth
              value={oc.bg_ignore_signs_percentage}
              onChange={(e) =>
                updateSimConfigOpenCDA({
                  bg_ignore_signs_percentage: Number(e.target.value),
                })
              }
            />
          </Stack>
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              key={`bg_ignore_walkers_percentage-${oc.bg_ignore_walkers_percentage}`}
              label="Ignore walkers %"
              type="number"
              size="small"
              fullWidth
              value={oc.bg_ignore_walkers_percentage}
              onChange={(e) =>
                updateSimConfigOpenCDA({
                  bg_ignore_walkers_percentage: Number(e.target.value),
                })
              }
            />
            <FormControlLabel
              control={
                <Switch
                  key={`auto_lane_change-${oc.auto_lane_change}`}
                  checked={oc.auto_lane_change}
                  onChange={(e) =>
                    updateSimConfigOpenCDA({
                      auto_lane_change: e.target.checked,
                    })
                  }
                />
              }
              label="Auto lane change"
            />
          </Stack>
        </Stack>
      )}

      <OpenCDATabRareSections oc={oc} update={updateSimConfigOpenCDA} />
    </Stack>
  );
}
