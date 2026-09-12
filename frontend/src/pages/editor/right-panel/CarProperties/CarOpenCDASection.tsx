import { useState } from 'react';
import {
  Box,
  Button,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid,
  Input,
  Stack,
  Switch,
  Typography,
} from '@mui/material';
import {
  opencdaPanelPaperSx,
  opencdaSectionLabelSx,
} from '../../../../shared/styles/opencdaUiStyles';
import {
  AIM_CHECK_CAV_BEHAVIOR_SERVICES,
  AIM_CHECK_CAV_COLOR,
} from '../../generators/exporters/aimCheckDefaults';
import { useEditorStore } from '../../../../store';
import type {
  Car,
  CavBehaviorService,
} from '../../../../store/editor-store.types';
import { numInputSlot } from '../right-panel.types';
import { formLabelStyles } from './CarProperties.types';
import { parseNumberInputChange } from '../../../../shared/utils/numberInput';

const DEFAULT_CAV_COLOR: [number, number, number] = [156, 255, 206];

function clampRgbValue(value: number): number {
  return Math.max(0, Math.min(255, value));
}

function parseRgbValueFromEvent(
  event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
): number | undefined {
  const parsed = parseNumberInputChange(event.target);
  if (parsed === undefined || !Number.isFinite(parsed)) {
    return undefined;
  }
  return clampRgbValue(parsed);
}

function parseNumberFromEvent(
  event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
): number | undefined {
  const parsed = parseNumberInputChange(event.target);
  if (parsed === undefined || !Number.isFinite(parsed)) {
    return undefined;
  }
  return parsed;
}

function RgbEditor({
  color,
  onChange,
}: {
  color: [number, number, number];
  onChange: (next: [number, number, number]) => void;
}) {
  return (
    <Grid container spacing={1}>
      {(['R', 'G', 'B'] as const).map((label, idx) => (
        <Grid xs={4} key={label}>
          <FormControl>
            <FormLabel sx={formLabelStyles}>{label}</FormLabel>
            <Input
              size="small"
              type="number"
              slotProps={numInputSlot}
              value={color[idx]}
              onChange={(e) => {
                const parsed = parseRgbValueFromEvent(e);
                if (parsed === undefined) return;
                const next = [...color] as [number, number, number];
                next[idx] = parsed;
                onChange(next);
              }}
            />
          </FormControl>
        </Grid>
      ))}
    </Grid>
  );
}

export default function CarOpenCDASection({ car }: { car: Car }) {
  const updateCar = useEditorStore((s) => s.updateCar);

  const [showColor, setShowColor] = useState(car.opencda_color != null);
  const [showMaxSpeed, setShowMaxSpeed] = useState(
    car.opencda_max_speed != null,
  );
  const [showV2x, setShowV2x] = useState(car.opencda_v2x != null);
  const [showId, setShowId] = useState(car.opencda_id != null);
  const [showModel, setShowModel] = useState(
    Boolean(car.opencda_carla_model?.trim()),
  );
  const [showBehaviorFlags, setShowBehaviorFlags] = useState(
    car.opencda_ignore_traffic_light != null ||
      car.opencda_overtake_allowed != null,
  );
  const [showBehaviorServices, setShowBehaviorServices] = useState(
    (car.opencda_behavior_services?.length ?? 0) > 0,
  );
  const [showName, setShowName] = useState(Boolean(car.opencda_name?.trim()));
  const [showCollisionAhead, setShowCollisionAhead] = useState(
    car.opencda_collision_time_ahead != null,
  );
  const [showLocalPlanner, setShowLocalPlanner] = useState(
    car.opencda_local_planner_debug != null ||
      car.opencda_local_planner_debug_trajectory != null,
  );

  const services = car.opencda_behavior_services ?? [];
  const hasService = (type: CavBehaviorService['type']) =>
    services.some((s) => s.type === type);
  const aimClient = services.find(
    (s): s is Extract<CavBehaviorService, { type: 'aim_client' }> =>
      s.type === 'aim_client',
  );

  const setServices = (next: CavBehaviorService[]) => {
    updateCar(car.id, {
      opencda_behavior_services: next.length > 0 ? next : undefined,
    });
  };

  const toggleService = (type: CavBehaviorService['type'], on: boolean) => {
    const without = services.filter((s) => s.type !== type);
    if (!on) {
      setServices(without);
      return;
    }
    if (type === 'self_informer') {
      setServices([...without, { type: 'self_informer' }]);
    } else if (type === 'aim_client') {
      setServices([...without, { type: 'aim_client', debug: false }]);
    } else {
      setServices([...without, { type: 'movement_controller' }]);
    }
  };

  const opencdaColor = car.opencda_color ?? DEFAULT_CAV_COLOR;

  return (
    <>
      <Divider sx={{ my: 1 }} />
      <Box sx={opencdaPanelPaperSx}>
        <Stack spacing={1.5}>
          <Typography sx={opencdaSectionLabelSx}>OpenCDA (CAV)</Typography>

          <Button
            size="small"
            variant="outlined"
            onClick={() => {
              setShowId(true);
              setShowColor(true);
              setShowBehaviorServices(true);
              updateCar(car.id, {
                opencda_id: car.opencda_id ?? 100,
                opencda_color: AIM_CHECK_CAV_COLOR,
                opencda_behavior_services: [...AIM_CHECK_CAV_BEHAVIOR_SERVICES],
              });
            }}
          >
            Apply AIM CAV preset
          </Button>

          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={showName}
                onChange={(e) => {
                  setShowName(e.target.checked);
                  updateCar(car.id, {
                    opencda_name: e.target.checked ? 'cav1' : undefined,
                  });
                }}
              />
            }
            label="Custom name (single_cav_list)"
          />
          {showName && (
            <FormControl>
              <FormLabel>name</FormLabel>
              <Input
                size="small"
                value={car.opencda_name ?? ''}
                slotProps={numInputSlot}
                onChange={(e) =>
                  updateCar(car.id, { opencda_name: e.target.value })
                }
              />
            </FormControl>
          )}

          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={showId}
                onChange={(e) => {
                  setShowId(e.target.checked);
                  updateCar(car.id, {
                    opencda_id: e.target.checked ? 100 : undefined,
                  });
                }}
              />
            }
            label="Custom CAV id"
          />
          {showId && (
            <FormControl>
              <FormLabel>id (numeric)</FormLabel>
              <Input
                size="small"
                type="number"
                slotProps={numInputSlot}
                value={car.opencda_id ?? 100}
                onChange={(e) => {
                  const parsed = parseNumberFromEvent(e);
                  if (parsed === undefined) return;
                  updateCar(car.id, {
                    opencda_id: parsed,
                  });
                }}
              />
            </FormControl>
          )}

          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={showModel}
                onChange={(e) => {
                  setShowModel(e.target.checked);
                  updateCar(car.id, {
                    opencda_carla_model: e.target.checked
                      ? 'vehicle.lincoln.mkz_2017'
                      : undefined,
                  });
                }}
              />
            }
            label="CARLA blueprint (model)"
          />
          {showModel && (
            <FormControl>
              <FormLabel>model</FormLabel>
              <Input
                size="small"
                value={car.opencda_carla_model ?? ''}
                slotProps={numInputSlot}
                onChange={(e) =>
                  updateCar(car.id, { opencda_carla_model: e.target.value })
                }
              />
            </FormControl>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Switch
              size="small"
              checked={showColor}
              onChange={(e) => {
                setShowColor(e.target.checked);
                updateCar(car.id, {
                  opencda_color: e.target.checked
                    ? DEFAULT_CAV_COLOR
                    : undefined,
                });
              }}
            />
            <FormLabel>OpenCDA color (RGB)</FormLabel>
          </Box>
          {showColor && (
            <RgbEditor
              color={opencdaColor}
              onChange={(next) => updateCar(car.id, { opencda_color: next })}
            />
          )}

          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={showMaxSpeed}
                onChange={(e) => {
                  setShowMaxSpeed(e.target.checked);
                  updateCar(car.id, {
                    opencda_max_speed: e.target.checked ? 60 : undefined,
                  });
                }}
              />
            }
            label="Override max_speed (km/h)"
          />
          {showMaxSpeed && (
            <FormControl>
              <FormLabel>max_speed</FormLabel>
              <Input
                size="small"
                type="number"
                slotProps={numInputSlot}
                value={car.opencda_max_speed ?? 60}
                onChange={(e) => {
                  const parsed = parseNumberFromEvent(e);
                  if (parsed === undefined) return;
                  updateCar(car.id, {
                    opencda_max_speed: parsed,
                  });
                }}
              />
            </FormControl>
          )}

          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={showCollisionAhead}
                onChange={(e) => {
                  setShowCollisionAhead(e.target.checked);
                  updateCar(car.id, {
                    opencda_collision_time_ahead: e.target.checked
                      ? 2
                      : undefined,
                  });
                }}
              />
            }
            label="collision_time_ahead override"
          />
          {showCollisionAhead && (
            <FormControl>
              <FormLabel>collision_time_ahead (s)</FormLabel>
              <Input
                size="small"
                type="number"
                slotProps={numInputSlot}
                value={car.opencda_collision_time_ahead ?? 2}
                onChange={(e) => {
                  const parsed = parseNumberFromEvent(e);
                  if (parsed === undefined) return;
                  updateCar(car.id, {
                    opencda_collision_time_ahead: parsed,
                  });
                }}
              />
            </FormControl>
          )}

          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={showLocalPlanner}
                onChange={(e) => {
                  setShowLocalPlanner(e.target.checked);
                  updateCar(car.id, {
                    opencda_local_planner_debug: e.target.checked
                      ? true
                      : undefined,
                    opencda_local_planner_debug_trajectory: e.target.checked
                      ? true
                      : undefined,
                  });
                }}
              />
            }
            label="local_planner debug overrides"
          />
          {showLocalPlanner && (
            <Stack spacing={0.5} sx={{ pl: 1 }}>
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={car.opencda_local_planner_debug ?? false}
                    onChange={(e) =>
                      updateCar(car.id, {
                        opencda_local_planner_debug: e.target.checked,
                      })
                    }
                  />
                }
                label="debug"
              />
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={
                      car.opencda_local_planner_debug_trajectory ?? false
                    }
                    onChange={(e) =>
                      updateCar(car.id, {
                        opencda_local_planner_debug_trajectory:
                          e.target.checked,
                      })
                    }
                  />
                }
                label="debug_trajectory"
              />
            </Stack>
          )}

          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={showBehaviorFlags}
                onChange={(e) => {
                  setShowBehaviorFlags(e.target.checked);
                  if (e.target.checked) {
                    updateCar(car.id, {
                      opencda_ignore_traffic_light: false,
                      opencda_overtake_allowed: false,
                    });
                  } else {
                    updateCar(car.id, {
                      opencda_ignore_traffic_light: undefined,
                      opencda_overtake_allowed: undefined,
                    });
                  }
                }}
              />
            }
            label="ignore_traffic_light / overtake overrides"
          />
          {showBehaviorFlags && (
            <Stack spacing={0.5} sx={{ pl: 1 }}>
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={car.opencda_ignore_traffic_light ?? false}
                    onChange={(e) =>
                      updateCar(car.id, {
                        opencda_ignore_traffic_light: e.target.checked,
                      })
                    }
                  />
                }
                label="ignore_traffic_light"
              />
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={car.opencda_overtake_allowed ?? false}
                    onChange={(e) =>
                      updateCar(car.id, {
                        opencda_overtake_allowed: e.target.checked,
                      })
                    }
                  />
                }
                label="overtake_allowed"
              />
            </Stack>
          )}

          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={showV2x}
                onChange={(e) => {
                  setShowV2x(e.target.checked);
                  updateCar(car.id, {
                    opencda_v2x: e.target.checked
                      ? { enabled: true, communication_range: 45 }
                      : undefined,
                  });
                }}
              />
            }
            label="V2X override"
          />
          {showV2x && (
            <Stack spacing={1} sx={{ pl: 1 }}>
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={car.opencda_v2x?.enabled ?? true}
                    onChange={(e) =>
                      updateCar(car.id, {
                        opencda_v2x: {
                          ...car.opencda_v2x,
                          enabled: e.target.checked,
                        },
                      })
                    }
                  />
                }
                label="enabled"
              />
              <FormControl>
                <FormLabel>communication_range (m)</FormLabel>
                <Input
                  size="small"
                  type="number"
                  slotProps={numInputSlot}
                  value={car.opencda_v2x?.communication_range ?? 45}
                  onChange={(e) => {
                    const parsed = parseNumberFromEvent(e);
                    if (parsed === undefined) return;
                    updateCar(car.id, {
                      opencda_v2x: {
                        ...car.opencda_v2x,
                        communication_range: parsed,
                      },
                    });
                  }}
                />
              </FormControl>
            </Stack>
          )}

          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={showBehaviorServices}
                onChange={(e) => {
                  setShowBehaviorServices(e.target.checked);
                  if (e.target.checked) {
                    setServices([
                      { type: 'self_informer' },
                      { type: 'aim_client', debug: false },
                      { type: 'movement_controller' },
                    ]);
                  } else {
                    setServices([]);
                  }
                }}
              />
            }
            label="behavior_services (AIM stack)"
          />
          {showBehaviorServices && (
            <Stack spacing={0.5} sx={{ pl: 1 }}>
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={hasService('self_informer')}
                    onChange={(e) =>
                      toggleService('self_informer', e.target.checked)
                    }
                  />
                }
                label="self_informer"
              />
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={hasService('aim_client')}
                    onChange={(e) =>
                      toggleService('aim_client', e.target.checked)
                    }
                  />
                }
                label="aim_client"
              />
              {hasService('aim_client') && (
                <FormControlLabel
                  sx={{ pl: 2 }}
                  control={
                    <Switch
                      size="small"
                      checked={aimClient?.debug ?? false}
                      onChange={(e) =>
                        setServices(
                          services.map((s) =>
                            s.type === 'aim_client'
                              ? { ...s, debug: e.target.checked }
                              : s,
                          ),
                        )
                      }
                    />
                  }
                  label="aim_client.debug"
                />
              )}
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={hasService('movement_controller')}
                    onChange={(e) =>
                      toggleService('movement_controller', e.target.checked)
                    }
                  />
                }
                label="movement_controller"
              />
            </Stack>
          )}
        </Stack>
      </Box>
    </>
  );
}
