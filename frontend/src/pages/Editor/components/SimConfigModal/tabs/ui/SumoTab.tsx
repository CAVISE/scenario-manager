import {
  Box,
  Button,
  Divider,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { useEditorStore } from '../../../../../../store';
import {
  defaultSimConfig,
  mergeSimConfigWithDefaults,
} from '../../../../Generators/types/configGeneratorsTypes';

export default function SumoTab() {
  const simConfig = mergeSimConfigWithDefaults(
    useEditorStore((s) => s.simConfig),
  );
  const cars = useEditorStore((s) => s.cars);
  const updateCar = useEditorStore((s) => s.updateCar);
  const sumo = simConfig.sumo ?? defaultSimConfig.sumo;
  const updateSimConfigSumo = useEditorStore((s) => s.updateSimConfigSumo);
  return (
    <Stack spacing={2}>
      <Typography variant="subtitle2" color="text.secondary">
        Files
      </Typography>
      <Stack direction="row" spacing={2}>
        <TextField
          label="Scenario name"
          size="small"
          fullWidth
          placeholder="scenario"
          value={sumo.scenario_name}
          onChange={(e) =>
            updateSimConfigSumo({ scenario_name: e.target.value })
          }
        />
        <TextField
          label="Net file"
          size="small"
          fullWidth
          placeholder="Town04.net.xml"
          value={sumo.net_file}
          onChange={(e) => updateSimConfigSumo({ net_file: e.target.value })}
        />
      </Stack>
      <FormControlLabel
        control={
          <Switch
            checked={sumo.full_output}
            onChange={(e) =>
              updateSimConfigSumo({ full_output: e.target.checked })
            }
          />
        }
        label="Full output (sumo_full_output.xml)"
      />

      <Divider />

      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="subtitle2" color="text.secondary">
          Vehicle types (vTypes)
        </Typography>
        <Button
          size="small"
          variant="outlined"
          onClick={() =>
            updateSimConfigSumo({
              vtypes: [
                ...sumo.vtypes,
                {
                  id: `vType_${sumo.vtypes.length}`,
                  minGap: 2.0,
                  tau: 0.4,
                  vClass: 'passenger',
                  carFollowModel: 'IDMM',
                  speedFactor: 'normc(1.00,0.00)',
                },
              ],
            })
          }
        >
          + Add vType
        </Button>
      </Stack>

      {sumo.vtypes.map((vt, i) => (
        <Box
          key={i}
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            p: 1.5,
          }}
        >
          <Stack spacing={1}>
            <Stack direction="row" spacing={1}>
              <TextField
                label="ID"
                size="small"
                fullWidth
                value={vt.id}
                onChange={(e) => {
                  const vtypes = [...sumo.vtypes];
                  vtypes[i] = { ...vt, id: e.target.value };
                  updateSimConfigSumo({ vtypes });
                }}
              />
              <TextField
                label="vClass"
                size="small"
                fullWidth
                value={vt.vClass}
                onChange={(e) => {
                  const vtypes = [...sumo.vtypes];
                  vtypes[i] = { ...vt, vClass: e.target.value };
                  updateSimConfigSumo({ vtypes });
                }}
              />
            </Stack>
            <Stack direction="row" spacing={1}>
              <TextField
                label="minGap"
                type="number"
                size="small"
                fullWidth
                inputProps={{ step: 0.1 }}
                value={vt.minGap}
                onChange={(e) => {
                  const vtypes = [...sumo.vtypes];
                  vtypes[i] = { ...vt, minGap: Number(e.target.value) };
                  updateSimConfigSumo({ vtypes });
                }}
              />
              <TextField
                label="tau"
                type="number"
                size="small"
                fullWidth
                inputProps={{ step: 0.1 }}
                value={vt.tau}
                onChange={(e) => {
                  const vtypes = [...sumo.vtypes];
                  vtypes[i] = { ...vt, tau: Number(e.target.value) };
                  updateSimConfigSumo({ vtypes });
                }}
              />
              <TextField
                label="carFollowModel"
                size="small"
                fullWidth
                value={vt.carFollowModel}
                onChange={(e) => {
                  const vtypes = [...sumo.vtypes];
                  vtypes[i] = { ...vt, carFollowModel: e.target.value };
                  updateSimConfigSumo({ vtypes });
                }}
              />
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <TextField
                label="speedFactor"
                size="small"
                fullWidth
                value={vt.speedFactor}
                onChange={(e) => {
                  const vtypes = [...sumo.vtypes];
                  vtypes[i] = { ...vt, speedFactor: e.target.value };
                  updateSimConfigSumo({ vtypes });
                }}
              />
              <Button
                size="small"
                color="error"
                onClick={() =>
                  updateSimConfigSumo({
                    vtypes: sumo.vtypes.filter((_, j) => j !== i),
                  })
                }
              >
                Remove
              </Button>
            </Stack>
          </Stack>
        </Box>
      ))}

      <Divider />

      <Typography variant="subtitle2" color="text.secondary">
        Vehicle routes
      </Typography>

      {cars.length === 0 ? (
        <Typography variant="caption" color="text.secondary">
          No vehicles on scene
        </Typography>
      ) : (
        cars.map((car, i) => (
          <Box
            key={car.id}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              p: 1.5,
            }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mb: 1, display: 'block' }}
            >
              {car.model || `Vehicle ${i + 1}`}
            </Typography>
            <Stack spacing={1}>
              <TextField
                label="Route edges"
                size="small"
                fullWidth
                placeholder='e.g. "27 26 -35.0.00"'
                value={car.sumo_edges ?? ''}
                onChange={(e) =>
                  updateCar(car.id, { sumo_edges: e.target.value })
                }
              />
              <Stack direction="row" spacing={1}>
                <TextField
                  label="Depart (s)"
                  type="number"
                  size="small"
                  fullWidth
                  inputProps={{ step: 0.05 }}
                  value={car.sumo_depart ?? 0.05}
                  onChange={(e) =>
                    updateCar(car.id, { sumo_depart: Number(e.target.value) })
                  }
                />
                <TextField
                  label="Max speed (m/s)"
                  type="number"
                  size="small"
                  fullWidth
                  inputProps={{ step: 0.1 }}
                  value={car.sumo_max_speed ?? 16.665}
                  onChange={(e) =>
                    updateCar(car.id, {
                      sumo_max_speed: Number(e.target.value),
                    })
                  }
                />
              </Stack>
              <Stack direction="row" spacing={1}>
                <TextField
                  label="Depart lane"
                  size="small"
                  fullWidth
                  placeholder='"best" or "4"'
                  value={car.sumo_depart_lane ?? ''}
                  onChange={(e) =>
                    updateCar(car.id, { sumo_depart_lane: e.target.value })
                  }
                />
                <TextField
                  label="Depart pos (m)"
                  type="number"
                  size="small"
                  fullWidth
                  value={car.sumo_depart_pos ?? 0}
                  onChange={(e) =>
                    updateCar(car.id, {
                      sumo_depart_pos: Number(e.target.value),
                    })
                  }
                />
              </Stack>
              <FormControl size="small" fullWidth>
                <InputLabel>vType</InputLabel>
                <Select
                  value={car.sumo_vtype ?? ''}
                  label="vType"
                  onChange={(e) =>
                    updateCar(car.id, { sumo_vtype: e.target.value })
                  }
                >
                  <MenuItem value="">
                    <em>none</em>
                  </MenuItem>
                  {sumo.vtypes.map((vt) => (
                    <MenuItem key={vt.id} value={vt.id}>
                      {vt.id}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControlLabel
                control={
                  <Switch
                    checked={!!car.sumo_stop}
                    onChange={(e) =>
                      updateCar(car.id, {
                        sumo_stop: e.target.checked
                          ? {
                              lane: '',
                              startPos: 0,
                              endPos: 5,
                              duration: 100000,
                            }
                          : undefined,
                      })
                    }
                  />
                }
                label="Static stop"
              />
              {car.sumo_stop && (
                <Stack direction="row" spacing={1}>
                  <TextField
                    label="Lane"
                    size="small"
                    fullWidth
                    placeholder="27_3"
                    value={car.sumo_stop.lane}
                    onChange={(e) =>
                      updateCar(car.id, {
                        sumo_stop: { ...car.sumo_stop!, lane: e.target.value },
                      })
                    }
                  />
                  <TextField
                    label="Start pos"
                    type="number"
                    size="small"
                    sx={{ width: 90 }}
                    value={car.sumo_stop.startPos}
                    onChange={(e) =>
                      updateCar(car.id, {
                        sumo_stop: {
                          ...car.sumo_stop!,
                          startPos: Number(e.target.value),
                        },
                      })
                    }
                  />
                  <TextField
                    label="End pos"
                    type="number"
                    size="small"
                    sx={{ width: 90 }}
                    value={car.sumo_stop.endPos}
                    onChange={(e) =>
                      updateCar(car.id, {
                        sumo_stop: {
                          ...car.sumo_stop!,
                          endPos: Number(e.target.value),
                        },
                      })
                    }
                  />
                  <TextField
                    label="Duration (s)"
                    type="number"
                    size="small"
                    sx={{ width: 100 }}
                    value={car.sumo_stop.duration}
                    onChange={(e) =>
                      updateCar(car.id, {
                        sumo_stop: {
                          ...car.sumo_stop!,
                          duration: Number(e.target.value),
                        },
                      })
                    }
                  />
                </Stack>
              )}
            </Stack>
          </Box>
        ))
      )}
    </Stack>
  );
}
