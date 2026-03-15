import { useState } from 'react';
import {
  Modal, Box, Typography, Tabs, Tab, Button,
  TextField, Switch, FormControlLabel, Select,
  MenuItem, FormControl, InputLabel, Divider, Stack,
} from '@mui/material';
import type { CarlaWeather } from '../../../store/useEditorStore';

import { useEditorStore } from '../../../store/useEditorStore';
import {
  defaultSimConfig
} from '../Generators/types/configGeneratorsTypes';
import { CARLA_MAPS, WEATHER_PRESETS } from './types/SimConfigModalTypes';
import type { SimConfigModalProps } from './types/SimConfigModalTypes';

export default function SimConfigModal({ open, onClose }: SimConfigModalProps) {
  const [tab, setTab] = useState(0);

  const simConfig              = useEditorStore(s => s.simConfig);
  const updateSimConfig        = useEditorStore(s => s.updateSimConfig);
  const updateSimConfigOmnet   = useEditorStore(s => s.updateSimConfigOmnet);
  const updateSimConfigArtery  = useEditorStore(s => s.updateSimConfigArtery);
  const updateSimConfigSionna  = useEditorStore(s => s.updateSimConfigSionna);
  const updateSimConfigCarla   = useEditorStore(s => s.updateSimConfigCarla);
  const updateSimConfigOpenCDA = useEditorStore(s => s.updateSimConfigOpenCDA);

  const oc = simConfig.opencda ?? defaultSimConfig.opencda;

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 580, bgcolor: 'background.paper',
        borderRadius: 2, boxShadow: 24, p: 4,
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        <Typography variant="h6" gutterBottom>Simulation Settings</Typography>

        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <TextField
            label="Duration (s)" type="number" size="small"
            value={simConfig.sim_duration}
            onChange={e => updateSimConfig({ sim_duration: Number(e.target.value) })}
            sx={{ width: 140 }}
          />
        </Stack>

        <Divider sx={{ mb: 2 }} />

        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }} variant="scrollable" scrollButtons="auto">
          <Tab label="OMNeT++" />
          <Tab label="Artery" />
          <Tab label="Sionna" />
          <Tab label="CARLA" />
          <Tab label="OpenCDA" sx={{ fontWeight: tab === 4 ? 700 : 400, color: tab === 4 ? 'success.main' : undefined }} />
        </Tabs>

        {tab === 0 && (
          <Stack spacing={2}>
            <Stack direction="row" spacing={2}>
              <TextField label="TX Power (mW)" type="number" size="small" fullWidth
                value={simConfig.omnet.tx_power}
                onChange={e => updateSimConfigOmnet({ tx_power: Number(e.target.value) })} />
              <TextField label="Bitrate (Mbps)" type="number" size="small" fullWidth
                value={simConfig.omnet.bitrate}
                onChange={e => updateSimConfigOmnet({ bitrate: Number(e.target.value) })} />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField label="Beacon Interval (ms)" type="number" size="small" fullWidth
                value={simConfig.omnet.beaconing_interval}
                onChange={e => updateSimConfigOmnet({ beaconing_interval: Number(e.target.value) })} />
              <TextField label="Max Interf. Dist (m)" type="number" size="small" fullWidth
                value={simConfig.omnet.max_interf_dist}
                onChange={e => updateSimConfigOmnet({ max_interf_dist: Number(e.target.value) })} />
            </Stack>
            <FormControl size="small" fullWidth>
              <InputLabel>Protocol</InputLabel>
              <Select value={simConfig.omnet.protocol} label="Protocol"
                onChange={e => updateSimConfigOmnet({ protocol: e.target.value as 'ITS-G5' | 'C-V2X' })}>
                <MenuItem value="ITS-G5">ITS-G5 (IEEE 802.11p)</MenuItem>
                <MenuItem value="C-V2X">C-V2X (LTE/5G)</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        )}

        {tab === 1 && (
          <Stack spacing={2}>
            <Typography variant="subtitle2" color="text.secondary">SUMO</Typography>
            <TextField label="SUMO Config (.sumocfg)" size="small" fullWidth
              value={simConfig.artery.sumo_config}
              onChange={e => updateSimConfigArtery({ sumo_config: e.target.value })} />
            <Stack direction="row" spacing={2}>
              <TextField label="Step Length (s)" type="number" size="small" fullWidth inputProps={{ step: 0.01 }}
                value={simConfig.artery.sumo_step_length}
                onChange={e => updateSimConfigArtery({ sumo_step_length: Number(e.target.value) })} />
              <TextField label="Seed" type="number" size="small" fullWidth
                value={simConfig.artery.sumo_seed}
                onChange={e => updateSimConfigArtery({ sumo_seed: Number(e.target.value) })} />
            </Stack>
            <Divider />
            <Typography variant="subtitle2" color="text.secondary">Middleware (Vehicles)</Typography>
            <Stack direction="row" spacing={2}>
              <TextField label="Update Interval (ms)" type="number" size="small" fullWidth
                value={simConfig.artery.middleware_update_interval}
                onChange={e => updateSimConfigArtery({ middleware_update_interval: Number(e.target.value) })} />
              <TextField label="Datetime" size="small" fullWidth
                value={simConfig.artery.datetime}
                onChange={e => updateSimConfigArtery({ datetime: e.target.value })} />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField label="CAM Min (ms)" type="number" size="small" fullWidth
                value={simConfig.artery.cam_interval_min}
                onChange={e => updateSimConfigArtery({ cam_interval_min: Number(e.target.value) })} />
              <TextField label="CAM Max (ms)" type="number" size="small" fullWidth
                value={simConfig.artery.cam_interval_max}
                onChange={e => updateSimConfigArtery({ cam_interval_max: Number(e.target.value) })} />
            </Stack>
            <Stack direction="row" gap={1}>
              <FormControlLabel control={<Switch checked={simConfig.artery.denm_enabled}
                onChange={e => updateSimConfigArtery({ denm_enabled: e.target.checked })} />} label="DENM" />
              <FormControlLabel control={<Switch checked={simConfig.artery.cp_service_enabled}
                onChange={e => updateSimConfigArtery({ cp_service_enabled: e.target.checked })} />} label="CP Service" />
            </Stack>
            <Divider />
            <Typography variant="subtitle2" color="text.secondary">RSU Services</Typography>
            <Stack direction="row" gap={1}>
              <FormControlLabel control={<Switch checked={simConfig.artery.rsu_cam_enabled}
                onChange={e => updateSimConfigArtery({ rsu_cam_enabled: e.target.checked })} />} label="CAM" />
              <FormControlLabel control={<Switch checked={simConfig.artery.rsu_denm_enabled}
                onChange={e => updateSimConfigArtery({ rsu_denm_enabled: e.target.checked })} />} label="DENM" />
            </Stack>
          </Stack>
        )}

        {tab === 2 && (
          <Stack spacing={2}>
            <TextField label="Carrier Frequency (Hz)" type="number" size="small" fullWidth
              value={simConfig.sionna.carrier_frequency}
              onChange={e => updateSimConfigSionna({ carrier_frequency: Number(e.target.value) })} />
            <Stack direction="row" spacing={2}>
              <TextField label="Max Depth" type="number" size="small" fullWidth
                value={simConfig.sionna.max_depth}
                onChange={e => updateSimConfigSionna({ max_depth: Number(e.target.value) })} />
              <TextField label="Num Samples" type="number" size="small" fullWidth
                value={simConfig.sionna.num_samples}
                onChange={e => updateSimConfigSionna({ num_samples: Number(e.target.value) })} />
            </Stack>
            <Stack direction="row" flexWrap="wrap" gap={1}>
              {(['los', 'reflection', 'diffraction', 'scattering'] as const).map(key => (
                <FormControlLabel key={key}
                  control={<Switch checked={simConfig.sionna[key]}
                    onChange={e => updateSimConfigSionna({ [key]: e.target.checked })} />}
                  label={key.charAt(0).toUpperCase() + key.slice(1)} />
              ))}
            </Stack>
          </Stack>
        )}

        {tab === 3 && (
          <Stack spacing={2}>
            <Stack direction="row" spacing={2}>
              <FormControl size="small" fullWidth>
                <InputLabel>Map</InputLabel>
                <Select value={simConfig.carla.map} label="Map"
                  onChange={e => updateSimConfigCarla({ map: e.target.value })}>
                  {CARLA_MAPS.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl size="small" fullWidth>
                <InputLabel>Weather</InputLabel>
                <Select value={simConfig.carla.weather_preset} label="Weather"
                  onChange={e => updateSimConfigCarla({ weather_preset: e.target.value as CarlaWeather })}>
                  {WEATHER_PRESETS.map(w => <MenuItem key={w} value={w}>{w}</MenuItem>)}
                </Select>
              </FormControl>
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField label="Vehicles" type="number" size="small" fullWidth
                value={simConfig.carla.num_vehicles}
                onChange={e => updateSimConfigCarla({ num_vehicles: Number(e.target.value) })} />
              <TextField label="Pedestrians" type="number" size="small" fullWidth
                value={simConfig.carla.num_pedestrians}
                onChange={e => updateSimConfigCarla({ num_pedestrians: Number(e.target.value) })} />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField label="Fixed Delta (s)" type="number" size="small" fullWidth inputProps={{ step: 0.01 }}
                value={simConfig.carla.fixed_delta_seconds}
                onChange={e => updateSimConfigCarla({ fixed_delta_seconds: Number(e.target.value) })} />
              <TextField label="TM Port" type="number" size="small" fullWidth
                value={simConfig.carla.traffic_manager_port}
                onChange={e => updateSimConfigCarla({ traffic_manager_port: Number(e.target.value) })} />
            </Stack>
            <FormControlLabel
              control={<Switch checked={simConfig.carla.synchronous_mode}
                onChange={e => updateSimConfigCarla({ synchronous_mode: e.target.checked })} />}
              label="Synchronous Mode" />
            <Divider />
            <Typography variant="subtitle2" color="text.secondary">Sensors</Typography>
            <Stack direction="row" flexWrap="wrap" gap={1}>
              {(['camera', 'lidar', 'radar', 'gnss', 'imu'] as const).map(s => (
                <FormControlLabel key={s}
                  control={<Switch checked={simConfig.carla.sensors[s]}
                    onChange={e => updateSimConfigCarla({ sensors: { ...simConfig.carla.sensors, [s]: e.target.checked } })} />}
                  label={s.toUpperCase()} />
              ))}
            </Stack>
            {simConfig.carla.sensors.lidar && (
              <Stack direction="row" spacing={2}>
                <TextField label="LiDAR Channels" type="number" size="small" fullWidth
                  value={simConfig.carla.lidar_channels}
                  onChange={e => updateSimConfigCarla({ lidar_channels: Number(e.target.value) })} />
                <TextField label="LiDAR Range (m)" type="number" size="small" fullWidth
                  value={simConfig.carla.lidar_range}
                  onChange={e => updateSimConfigCarla({ lidar_range: Number(e.target.value) })} />
              </Stack>
            )}
            {simConfig.carla.sensors.camera && (
              <TextField label="Camera FOV (°)" type="number" size="small"
                value={simConfig.carla.camera_fov}
                onChange={e => updateSimConfigCarla({ camera_fov: Number(e.target.value) })}
                sx={{ width: '48%' }} />
            )}
          </Stack>
        )}

        {tab === 4 && (
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

            <Typography variant="subtitle2" color="text.secondary">Vehicle LiDAR</Typography>
            <Stack direction="row" spacing={2}>
              <TextField label="Channels" type="number" size="small" fullWidth
                value={oc.lidar_channels}
                onChange={e => updateSimConfigOpenCDA({ lidar_channels: Number(e.target.value) })} />
              <TextField label="Range (m)" type="number" size="small" fullWidth
                value={oc.lidar_range}
                onChange={e => updateSimConfigOpenCDA({ lidar_range: Number(e.target.value) })} />
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
            <TextField label="Camera count (0–4)" type="number" size="small"
              inputProps={{ min: 0, max: 4 }}
              value={oc.rsu_cam_num}
              onChange={e => updateSimConfigOpenCDA({ rsu_cam_num: Number(e.target.value) })}
              sx={{ width: '48%' }} />
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
                <Stack direction="row" spacing={2}>
                  <TextField label="Speed % (−100=2x)" type="number" size="small" fullWidth
                    value={oc.global_speed_perc}
                    onChange={e => updateSimConfigOpenCDA({ global_speed_perc: Number(e.target.value) })} />
                  <TextField label="Vehicles" type="number" size="small" fullWidth
                    value={oc.bg_vehicle_num}
                    onChange={e => updateSimConfigOpenCDA({ bg_vehicle_num: Number(e.target.value) })} />
                </Stack>
                <Stack direction="row" spacing={2}>
                  <TextField label="Ignore lights %" type="number" size="small" fullWidth
                    value={oc.ignore_lights_percentage}
                    onChange={e => updateSimConfigOpenCDA({ ignore_lights_percentage: Number(e.target.value) })} />
                  <FormControlLabel
                    control={<Switch checked={oc.auto_lane_change}
                      onChange={e => updateSimConfigOpenCDA({ auto_lane_change: e.target.checked })} />}
                    label="Auto lane change" />
                </Stack>
              </Stack>
            )}
          </Stack>
        )}

        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 3 }}>
          <Stack direction="row" spacing={1}>


          </Stack>
          <Button onClick={onClose} variant="outlined">Close</Button>
        </Stack>
      </Box>
    </Modal>
  );
}
