import { Divider, FormControlLabel, Stack, Switch, TextField, Typography } from "@mui/material";
import { useEditorStore } from "../../../../../store/useEditorStore";
import { defaultSimConfig, mergeSimConfigWithDefaults } from "../../../Generators/types/configGeneratorsTypes";

export default function OpenCDATab() {
  const simConfig              = mergeSimConfigWithDefaults(useEditorStore(s => s.simConfig));
  const updateSimConfigOpenCDA = useEditorStore(s => s.updateSimConfigOpenCDA);
  const oc   = simConfig.opencda ?? defaultSimConfig.opencda;
  return (
    <Stack spacing={2}>
            <Typography variant="subtitle2" color="text.secondary">Blueprint</Typography>
            <FormControlLabel
              control={<Switch checked={oc.use_multi_class_bp}
                onChange={e => updateSimConfigOpenCDA({ use_multi_class_bp: e.target.checked })} />}
              label="Multi-class blueprints" />
            <TextField label="Blueprint meta path" size="small" fullWidth
              value={oc.bp_meta_path}
              onChange={e => updateSimConfigOpenCDA({ bp_meta_path: e.target.value })} />
            <Typography variant="caption" color="text.secondary">Class sample probabilities (sum ≤ 1)</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {(['car', 'truck', 'bus', 'bicycle', 'motorcycle'] as const).map(cls => (
                <TextField key={cls} label={cls} type="number" size="small"
                  inputProps={{ step: 0.05, min: 0, max: 1 }}
                  value={oc.bp_class_sample_prob[cls]}
                  onChange={e => updateSimConfigOpenCDA({
                    bp_class_sample_prob: { ...oc.bp_class_sample_prob, [cls]: Number(e.target.value) },
                  })}
                  sx={{ width: 90 }} />
              ))}
            </Stack>

            <Divider />

            <Typography variant="subtitle2" color="text.secondary">Vehicle behavior</Typography>
            <Stack direction="row" spacing={2}>
              <TextField label="Max speed (km/h)" type="number" size="small" fullWidth
                value={oc.max_speed}
                onChange={e => updateSimConfigOpenCDA({ max_speed: Number(e.target.value) })} />
              <TextField label="Tailgate speed" type="number" size="small" fullWidth
                value={oc.tailgate_speed}
                onChange={e => updateSimConfigOpenCDA({ tailgate_speed: Number(e.target.value) })} />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField label="Safety time (s)" type="number" size="small" fullWidth
                value={oc.safety_time}
                onChange={e => updateSimConfigOpenCDA({ safety_time: Number(e.target.value) })} />
              <TextField label="Emergency param" type="number" size="small" fullWidth inputProps={{ step: 0.05 }}
                value={oc.emergency_param}
                onChange={e => updateSimConfigOpenCDA({ emergency_param: Number(e.target.value) })} />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField label="Collision ahead (s)" type="number" size="small" fullWidth
                value={oc.collision_time_ahead}
                onChange={e => updateSimConfigOpenCDA({ collision_time_ahead: Number(e.target.value) })} />
              <TextField label="Sample resolution (m)" type="number" size="small" fullWidth
                value={oc.sample_resolution}
                onChange={e => updateSimConfigOpenCDA({ sample_resolution: Number(e.target.value) })} />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField label="Speed lim dist (m)" type="number" size="small" fullWidth
                value={oc.speed_lim_dist}
                onChange={e => updateSimConfigOpenCDA({ speed_lim_dist: Number(e.target.value) })} />
              <TextField label="Speed decrease" type="number" size="small" fullWidth
                value={oc.speed_decrease}
                onChange={e => updateSimConfigOpenCDA({ speed_decrease: Number(e.target.value) })} />
            </Stack>
            <TextField label="Overtake counter recover" type="number" size="small" fullWidth
              value={oc.overtake_counter_recover}
              onChange={e => updateSimConfigOpenCDA({ overtake_counter_recover: Number(e.target.value) })} />
            <Stack direction="row" gap={1} flexWrap="wrap">
              <FormControlLabel
                control={<Switch checked={oc.ignore_traffic_light}
                  onChange={e => updateSimConfigOpenCDA({ ignore_traffic_light: e.target.checked })} />}
                label="Ignore traffic lights" />
              <FormControlLabel
                control={<Switch checked={oc.overtake_allowed}
                  onChange={e => updateSimConfigOpenCDA({ overtake_allowed: e.target.checked })} />}
                label="Overtake allowed" />
            </Stack>

            <Divider />
            <Typography variant="subtitle2" color="text.secondary">Local planner</Typography>
            <Stack direction="row" spacing={2}>
              <TextField label="Buffer size" type="number" size="small" fullWidth
                value={oc.local_planner.buffer_size}
                onChange={e => updateSimConfigOpenCDA({
                  local_planner: { ...oc.local_planner, buffer_size: Number(e.target.value) },
                })} />
              <TextField label="Traj. update freq" type="number" size="small" fullWidth
                value={oc.local_planner.trajectory_update_freq}
                onChange={e => updateSimConfigOpenCDA({
                  local_planner: { ...oc.local_planner, trajectory_update_freq: Number(e.target.value) },
                })} />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField label="Waypoint update freq" type="number" size="small" fullWidth
                value={oc.local_planner.waypoint_update_freq}
                onChange={e => updateSimConfigOpenCDA({
                  local_planner: { ...oc.local_planner, waypoint_update_freq: Number(e.target.value) },
                })} />
              <TextField label="Min dist (m)" type="number" size="small" fullWidth
                value={oc.local_planner.min_dist}
                onChange={e => updateSimConfigOpenCDA({
                  local_planner: { ...oc.local_planner, min_dist: Number(e.target.value) },
                })} />
            </Stack>
            <Stack direction="row" spacing={2} alignItems="center">
              <TextField label="Trajectory dt (s)" type="number" size="small" fullWidth inputProps={{ step: 0.05 }}
                value={oc.local_planner.trajectory_dt}
                onChange={e => updateSimConfigOpenCDA({
                  local_planner: { ...oc.local_planner, trajectory_dt: Number(e.target.value) },
                })} />
              <FormControlLabel
                control={<Switch checked={oc.local_planner.debug}
                  onChange={e => updateSimConfigOpenCDA({
                    local_planner: { ...oc.local_planner, debug: e.target.checked },
                  })} />}
                label="Debug" />
              <FormControlLabel
                control={<Switch checked={oc.local_planner.debug_trajectory}
                  onChange={e => updateSimConfigOpenCDA({
                    local_planner: { ...oc.local_planner, debug_trajectory: e.target.checked },
                  })} />}
                label="Debug traj." />
            </Stack>

            <Divider />

            <Typography variant="subtitle2" color="text.secondary">Vehicle sensing</Typography>
            <Stack direction="row" spacing={2}>
              <TextField label="Cam visualize (0/1)" type="number" size="small" fullWidth
                inputProps={{ min: 0, max: 1 }}
                value={oc.vehicle_camera_visualize}
                onChange={e => updateSimConfigOpenCDA({ vehicle_camera_visualize: Number(e.target.value) })} />
              <TextField label="Onboard cameras (0–4)" type="number" size="small" fullWidth
                inputProps={{ min: 0, max: 4 }}
                value={oc.vehicle_cam_num}
                onChange={e => updateSimConfigOpenCDA({ vehicle_cam_num: Number(e.target.value) })} />
            </Stack>
            <Typography variant="subtitle2" color="text.secondary" sx={{ pt: 1 }}>Vehicle LiDAR</Typography>
            <Stack direction="row" spacing={2}>
              <TextField label="Channels" type="number" size="small" fullWidth
                value={oc.lidar_channels}
                onChange={e => updateSimConfigOpenCDA({ lidar_channels: Number(e.target.value) })} />
              <TextField label="Range (m)" type="number" size="small" fullWidth
                value={oc.lidar_range}
                onChange={e => updateSimConfigOpenCDA({ lidar_range: Number(e.target.value) })} />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField label="Points / second" type="number" size="small" fullWidth
                value={oc.lidar_points_per_second}
                onChange={e => updateSimConfigOpenCDA({ lidar_points_per_second: Number(e.target.value) })} />
              <TextField label="Rotation freq (Hz)" type="number" size="small" fullWidth
                value={oc.lidar_rotation_frequency}
                onChange={e => updateSimConfigOpenCDA({ lidar_rotation_frequency: Number(e.target.value) })} />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField label="Upper FOV (°)" type="number" size="small" fullWidth
                value={oc.lidar_upper_fov}
                onChange={e => updateSimConfigOpenCDA({ lidar_upper_fov: Number(e.target.value) })} />
              <TextField label="Lower FOV (°)" type="number" size="small" fullWidth
                value={oc.lidar_lower_fov}
                onChange={e => updateSimConfigOpenCDA({ lidar_lower_fov: Number(e.target.value) })} />
            </Stack>
            <Stack direction="row" gap={1}>
              <FormControlLabel
                control={<Switch checked={oc.perception_activate}
                  onChange={e => updateSimConfigOpenCDA({ perception_activate: e.target.checked })} />}
                label="Perception" />
              <FormControlLabel
                control={<Switch checked={oc.localization_activate}
                  onChange={e => updateSimConfigOpenCDA({ localization_activate: e.target.checked })} />}
                label="Localization" />
              <FormControlLabel
                control={<Switch checked={oc.lidar_visualize}
                  onChange={e => updateSimConfigOpenCDA({ lidar_visualize: e.target.checked })} />}
                label="Visualize LiDAR" />
            </Stack>

            <Typography variant="caption" color="text.secondary">LiDAR dropoff &amp; noise (vehicle + RSU)</Typography>
            <Stack direction="row" spacing={2}>
              <TextField label="Dropoff rate" type="number" size="small" fullWidth inputProps={{ step: 0.05 }}
                value={oc.lidar_sim.dropoff_general_rate}
                onChange={e => updateSimConfigOpenCDA({
                  lidar_sim: { ...oc.lidar_sim, dropoff_general_rate: Number(e.target.value) },
                })} />
              <TextField label="Intensity limit" type="number" size="small" fullWidth inputProps={{ step: 0.05 }}
                value={oc.lidar_sim.dropoff_intensity_limit}
                onChange={e => updateSimConfigOpenCDA({
                  lidar_sim: { ...oc.lidar_sim, dropoff_intensity_limit: Number(e.target.value) },
                })} />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField label="Zero intensity" type="number" size="small" fullWidth inputProps={{ step: 0.05 }}
                value={oc.lidar_sim.dropoff_zero_intensity}
                onChange={e => updateSimConfigOpenCDA({
                  lidar_sim: { ...oc.lidar_sim, dropoff_zero_intensity: Number(e.target.value) },
                })} />
              <TextField label="Noise stddev" type="number" size="small" fullWidth inputProps={{ step: 0.01 }}
                value={oc.lidar_sim.noise_stddev}
                onChange={e => updateSimConfigOpenCDA({
                  lidar_sim: { ...oc.lidar_sim, noise_stddev: Number(e.target.value) },
                })} />
            </Stack>

            <Typography variant="subtitle2" color="text.secondary" sx={{ pt: 1 }}>Localization</Typography>
            <Typography variant="caption" color="text.secondary">GNSS noise (RSU block, when localization on)</Typography>
            <Stack direction="row" spacing={2}>
              <TextField label="Alt σ" type="number" size="small" fullWidth inputProps={{ step: 0.01 }}
                value={oc.gnss_noise.alt_stddev}
                onChange={e => updateSimConfigOpenCDA({
                  gnss_noise: { ...oc.gnss_noise, alt_stddev: Number(e.target.value) },
                })} />
              <TextField label="Lat σ" type="number" size="small" fullWidth inputProps={{ step: 1e-7 }}
                value={oc.gnss_noise.lat_stddev}
                onChange={e => updateSimConfigOpenCDA({
                  gnss_noise: { ...oc.gnss_noise, lat_stddev: Number(e.target.value) },
                })} />
              <TextField label="Lon σ" type="number" size="small" fullWidth inputProps={{ step: 1e-7 }}
                value={oc.gnss_noise.lon_stddev}
                onChange={e => updateSimConfigOpenCDA({
                  gnss_noise: { ...oc.gnss_noise, lon_stddev: Number(e.target.value) },
                })} />
            </Stack>
            <FormControlLabel
              control={<Switch checked={oc.vehicle_localization_debug_animation}
                onChange={e => updateSimConfigOpenCDA({ vehicle_localization_debug_animation: e.target.checked })} />}
              label="Vehicle localization debug animation" />

            <Divider />

            <Typography variant="subtitle2" color="text.secondary">RSU base</Typography>
            <Stack direction="row" spacing={2}>
              <TextField label="LiDAR channels" type="number" size="small" fullWidth
                value={oc.rsu_lidar_channels}
                onChange={e => updateSimConfigOpenCDA({ rsu_lidar_channels: Number(e.target.value) })} />
              <TextField label="LiDAR range (m)" type="number" size="small" fullWidth
                value={oc.rsu_lidar_range}
                onChange={e => updateSimConfigOpenCDA({ rsu_lidar_range: Number(e.target.value) })} />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField label="RSU cam visualize (0/1)" type="number" size="small" fullWidth
                inputProps={{ min: 0, max: 1 }}
                value={oc.rsu_camera_visualize}
                onChange={e => updateSimConfigOpenCDA({ rsu_camera_visualize: Number(e.target.value) })} />
              <TextField label="Camera count (0–4)" type="number" size="small" fullWidth
                inputProps={{ min: 0, max: 4 }}
                value={oc.rsu_cam_num}
                onChange={e => updateSimConfigOpenCDA({ rsu_cam_num: Number(e.target.value) })} />
            </Stack>
            <FormControlLabel
              control={<Switch checked={oc.rsu_perception_activate}
                onChange={e => updateSimConfigOpenCDA({ rsu_perception_activate: e.target.checked })} />}
              label="RSU Perception" />

            <Divider />

            <Typography variant="subtitle2" color="text.secondary">SUMO co-simulation</Typography>
            <Stack direction="row" spacing={2}>
              <TextField label="Host" size="small" fullWidth
                value={oc.sumo_host}
                onChange={e => updateSimConfigOpenCDA({ sumo_host: e.target.value })} />
              <TextField label="Port" type="number" size="small" fullWidth
                value={oc.sumo_port}
                onChange={e => updateSimConfigOpenCDA({ sumo_port: Number(e.target.value) })} />
            </Stack>
            <Stack direction="row" spacing={2} alignItems="center">
              <TextField label="Client order" type="number" size="small"
                value={oc.sumo_client_order}
                onChange={e => updateSimConfigOpenCDA({ sumo_client_order: Number(e.target.value) })}
                sx={{ width: 140 }} />
              <FormControlLabel
                control={<Switch checked={oc.sumo_gui}
                  onChange={e => updateSimConfigOpenCDA({ sumo_gui: e.target.checked })} />}
                label="SUMO GUI" />
            </Stack>

            <Divider />

            <Typography variant="subtitle2" color="text.secondary">Background CARLA traffic</Typography>
            <FormControlLabel
              control={<Switch checked={oc.enable_background_traffic}
                onChange={e => updateSimConfigOpenCDA({ enable_background_traffic: e.target.checked })} />}
              label="Enable background traffic" />
            {oc.enable_background_traffic && (
              <Stack spacing={2}>
                <FormControlLabel
                  control={<Switch checked={oc.bg_traffic_random}
                    onChange={e => updateSimConfigOpenCDA({ bg_traffic_random: e.target.checked })} />}
                  label="Random spawn" />
                <Typography variant="caption" color="text.secondary">Spawn range [x0,x1,y0,y1,z0,z1] + vehicle count below</Typography>
                <Stack direction="row" spacing={2}>
                  <TextField label="X min" type="number" size="small" fullWidth
                    value={oc.bg_spawn_range.x_min}
                    onChange={e => updateSimConfigOpenCDA({
                      bg_spawn_range: { ...oc.bg_spawn_range, x_min: Number(e.target.value) },
                    })} />
                  <TextField label="X max" type="number" size="small" fullWidth
                    value={oc.bg_spawn_range.x_max}
                    onChange={e => updateSimConfigOpenCDA({
                      bg_spawn_range: { ...oc.bg_spawn_range, x_max: Number(e.target.value) },
                    })} />
                </Stack>
                <Stack direction="row" spacing={2}>
                  <TextField label="Y min" type="number" size="small" fullWidth
                    value={oc.bg_spawn_range.y_min}
                    onChange={e => updateSimConfigOpenCDA({
                      bg_spawn_range: { ...oc.bg_spawn_range, y_min: Number(e.target.value) },
                    })} />
                  <TextField label="Y max" type="number" size="small" fullWidth
                    value={oc.bg_spawn_range.y_max}
                    onChange={e => updateSimConfigOpenCDA({
                      bg_spawn_range: { ...oc.bg_spawn_range, y_max: Number(e.target.value) },
                    })} />
                </Stack>
                <Stack direction="row" spacing={2}>
                  <TextField label="Z min" type="number" size="small" fullWidth
                    value={oc.bg_spawn_range.z_min}
                    onChange={e => updateSimConfigOpenCDA({
                      bg_spawn_range: { ...oc.bg_spawn_range, z_min: Number(e.target.value) },
                    })} />
                  <TextField label="Z max" type="number" size="small" fullWidth
                    value={oc.bg_spawn_range.z_max}
                    onChange={e => updateSimConfigOpenCDA({
                      bg_spawn_range: { ...oc.bg_spawn_range, z_max: Number(e.target.value) },
                    })} />
                </Stack>
                <Stack direction="row" spacing={2}>
                  <TextField label="Speed % (−100=2x)" type="number" size="small" fullWidth
                    value={oc.global_speed_perc}
                    onChange={e => updateSimConfigOpenCDA({ global_speed_perc: Number(e.target.value) })} />
                  <TextField label="Vehicles" type="number" size="small" fullWidth
                    value={oc.bg_vehicle_num}
                    onChange={e => updateSimConfigOpenCDA({ bg_vehicle_num: Number(e.target.value) })} />
                </Stack>
                <Stack direction="row" spacing={2}>
                  <TextField label="Global distance (m)" type="number" size="small" fullWidth
                    value={oc.bg_global_distance}
                    onChange={e => updateSimConfigOpenCDA({ bg_global_distance: Number(e.target.value) })} />
                  <FormControlLabel
                    control={<Switch checked={oc.bg_set_osm_mode}
                      onChange={e => updateSimConfigOpenCDA({ bg_set_osm_mode: e.target.checked })} />}
                    label="OSM mode" />
                </Stack>
                <Stack direction="row" spacing={2}>
                  <TextField label="Ignore lights %" type="number" size="small" fullWidth
                    value={oc.ignore_lights_percentage}
                    onChange={e => updateSimConfigOpenCDA({ ignore_lights_percentage: Number(e.target.value) })} />
                  <TextField label="Ignore signs %" type="number" size="small" fullWidth
                    value={oc.bg_ignore_signs_percentage}
                    onChange={e => updateSimConfigOpenCDA({ bg_ignore_signs_percentage: Number(e.target.value) })} />
                </Stack>
                <Stack direction="row" spacing={2} alignItems="center">
                  <TextField label="Ignore walkers %" type="number" size="small" fullWidth
                    value={oc.bg_ignore_walkers_percentage}
                    onChange={e => updateSimConfigOpenCDA({ bg_ignore_walkers_percentage: Number(e.target.value) })} />
                  <FormControlLabel
                    control={<Switch checked={oc.auto_lane_change}
                      onChange={e => updateSimConfigOpenCDA({ auto_lane_change: e.target.checked })} />}
                    label="Auto lane change" />
                </Stack>
              </Stack>
            )}
          </Stack>
  )
}
