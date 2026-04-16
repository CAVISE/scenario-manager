import { Box, Button, Divider, FormControl, FormControlLabel, InputLabel, MenuItem, Select, Stack, Switch, TextField, Typography } from "@mui/material";
import { defaultSimConfig } from "../../../Generators/types/configGeneratorsTypes";
import { useEditorStore } from "../../../../../store/useEditorStore";

export default function CapiTab() {
  const simConfig           = useEditorStore(s => s.simConfig);
  const updateSimConfigCAPI = useEditorStore(s => s.updateSimConfigCAPI);
  const capi = simConfig.capi    ?? defaultSimConfig.capi;
  return (
    <Stack spacing={2}>
            <Typography variant="subtitle2" color="text.secondary">Network</Typography>
            <TextField label="Network" size="small" fullWidth
              placeholder="artery.inet.World"
              value={capi.network}
              onChange={e => updateSimConfigCAPI({ network: e.target.value })} />

            <Divider />
            <Typography variant="subtitle2" color="text.secondary">Command environment</Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <FormControlLabel
                control={<Switch checked={capi.cmdenv_express_mode}
                  onChange={e => updateSimConfigCAPI({ cmdenv_express_mode: e.target.checked })} />}
                label="Express mode" />
            </Stack>
            <TextField label="Output file" size="small" fullWidth
              placeholder=".cmdenv-log"
              value={capi.cmdenv_output_file}
              onChange={e => updateSimConfigCAPI({ cmdenv_output_file: e.target.value })} />
            <Stack direction="row" gap={1}>
              <FormControlLabel
                control={<Switch checked={capi.scalar_recording}
                  onChange={e => updateSimConfigCAPI({ scalar_recording: e.target.checked })} />}
                label="Scalar recording" />
              <FormControlLabel
                control={<Switch checked={capi.vector_recording}
                  onChange={e => updateSimConfigCAPI({ vector_recording: e.target.checked })} />}
                label="Vector recording" />
            </Stack>

            <Divider />
            <Typography variant="subtitle2" color="text.secondary">CAPI connection</Typography>
            <Stack direction="row" spacing={2}>
              <TextField label="Address" size="small" fullWidth
                placeholder="tcp://*:7777"
                value={capi.address}
                onChange={e => updateSimConfigCAPI({ address: e.target.value })} />
              <TextField label="Client ID" type="number" size="small" fullWidth
                value={capi.client_id}
                onChange={e => updateSimConfigCAPI({ client_id: Number(e.target.value) })} />
            </Stack>
            <FormControl size="small" fullWidth>
              <InputLabel>Log level</InputLabel>
              <Select value={capi.capi_log_level} label="Log level"
                onChange={e => updateSimConfigCAPI({ capi_log_level: e.target.value as 'debug' | 'info' | 'warn' | 'error' })}>
                <MenuItem value="debug">debug</MenuItem>
                <MenuItem value="info">info</MenuItem>
                <MenuItem value="warn">warn</MenuItem>
                <MenuItem value="error">error</MenuItem>
              </Select>
            </FormControl>

            <Divider />
            <Typography variant="subtitle2" color="text.secondary">TraCI (ConnectLauncher)</Typography>
            <Stack direction="row" spacing={2}>
              <TextField label="Hostname" size="small" fullWidth
                placeholder="sumo"
                value={capi.traci_hostname}
                onChange={e => updateSimConfigCAPI({ traci_hostname: e.target.value })} />
              <TextField label="Port" type="number" size="small" fullWidth
                value={capi.traci_port}
                onChange={e => updateSimConfigCAPI({ traci_port: Number(e.target.value) })} />
            </Stack>

            <Divider />
            <Typography variant="subtitle2" color="text.secondary">Radio</Typography>
            <Stack direction="row" spacing={2}>
              <TextField label="Carrier frequency" size="small" fullWidth
                placeholder="5.9 GHz"
                value={capi.carrier_frequency}
                onChange={e => updateSimConfigCAPI({ carrier_frequency: e.target.value })} />
              <TextField label="TX power" size="small" fullWidth
                placeholder="200 mW"
                value={capi.tx_power}
                onChange={e => updateSimConfigCAPI({ tx_power: e.target.value })} />
            </Stack>
            <TextField label="Channel number" type="number" size="small"
              value={capi.channel_number}
              onChange={e => updateSimConfigCAPI({ channel_number: Number(e.target.value) })}
              sx={{ width: '48%' }} />

            <Divider />
            <Typography variant="subtitle2" color="text.secondary">Middleware</Typography>
            <Stack direction="row" spacing={2}>
              <TextField label="Update interval (s)" type="number" size="small" fullWidth
                inputProps={{ step: 0.01 }}
                value={capi.middleware_update_interval}
                onChange={e => updateSimConfigCAPI({ middleware_update_interval: Number(e.target.value) })} />
              <TextField label="Datetime" size="small" fullWidth
                value={capi.datetime}
                onChange={e => updateSimConfigCAPI({ datetime: e.target.value })} />
            </Stack>

            <Divider />
            <Typography variant="subtitle2" color="text.secondary">Services (services.xml)</Typography>

            <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.5 }}>
              <Stack spacing={1}>
                <FormControlLabel
                  control={<Switch checked={capi.ca_service_enabled}
                    onChange={e => updateSimConfigCAPI({ ca_service_enabled: e.target.checked })} />}
                  label="CaService" />
                {capi.ca_service_enabled && (
                  <TextField label="Port" type="number" size="small" sx={{ width: 120 }}
                    value={capi.ca_service_port}
                    onChange={e => updateSimConfigCAPI({ ca_service_port: Number(e.target.value) })} />
                )}
              </Stack>
            </Box>

            <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.5 }}>
              <Stack spacing={1}>
                <FormControlLabel
                  control={<Switch checked={capi.cosim_service_enabled}
                    onChange={e => updateSimConfigCAPI({ cosim_service_enabled: e.target.checked })} />}
                  label="CosimService" />
                {capi.cosim_service_enabled && (
                  <Stack direction="row" spacing={1}>
                    <TextField label="Port" type="number" size="small" sx={{ width: 120 }}
                      value={capi.cosim_service_port}
                      onChange={e => updateSimConfigCAPI({ cosim_service_port: Number(e.target.value) })} />
                    <TextField label="Filter pattern" size="small" fullWidth
                      placeholder="(cav|rsu)-.*"
                      value={capi.cosim_filter_pattern}
                      onChange={e => updateSimConfigCAPI({ cosim_filter_pattern: e.target.value })} />
                  </Stack>
                )}
              </Stack>
            </Box>

            <Divider />
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle2" color="text.secondary">Extra configs ([Config ...])</Typography>
              <Button size="small" variant="outlined" onClick={() =>
                updateSimConfigCAPI({
                  extra_configs: [...capi.extra_configs, {
                    name:                   'custom',
                    path_loss_type:         'Gemv2',
                    small_scale_variations: false,
                    visualization:          false,
                  }],
                })
              }>
                + Add config
              </Button>
            </Stack>

            {capi.extra_configs.map((ec, i) => (
              <Box key={i} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.5 }}>
                <Stack spacing={1}>
                  <Stack direction="row" spacing={1}>
                    <TextField label="Name" size="small" fullWidth
                      placeholder="gemv2"
                      value={ec.name}
                      onChange={e => {
                        const extra_configs = [...capi.extra_configs];
                        extra_configs[i] = { ...ec, name: e.target.value };
                        updateSimConfigCAPI({ extra_configs });
                      }} />
                    <TextField label="Path loss type" size="small" fullWidth
                      placeholder="Gemv2"
                      value={ec.path_loss_type}
                      onChange={e => {
                        const extra_configs = [...capi.extra_configs];
                        extra_configs[i] = { ...ec, path_loss_type: e.target.value };
                        updateSimConfigCAPI({ extra_configs });
                      }} />
                  </Stack>
                  <Stack direction="row" gap={1} alignItems="center">
                    <FormControlLabel
                      control={<Switch checked={ec.small_scale_variations}
                        onChange={e => {
                          const extra_configs = [...capi.extra_configs];
                          extra_configs[i] = { ...ec, small_scale_variations: e.target.checked };
                          updateSimConfigCAPI({ extra_configs });
                        }} />}
                      label="Small scale variations" />
                    <FormControlLabel
                      control={<Switch checked={ec.visualization}
                        onChange={e => {
                          const extra_configs = [...capi.extra_configs];
                          extra_configs[i] = { ...ec, visualization: e.target.checked };
                          updateSimConfigCAPI({ extra_configs });
                        }} />}
                      label="Visualization" />
                    <Button size="small" color="error"
                      onClick={() => updateSimConfigCAPI({
                        extra_configs: capi.extra_configs.filter((_, j) => j !== i),
                      })}>
                      Remove
                    </Button>
                  </Stack>
                </Stack>
              </Box>
            ))}

          </Stack>
  )
}
