import { useState } from 'react';
import { Button, ToggleButtonGroup, ToggleButton, Switch } from '@mui/material';
import { AIM_CHECK_RSU_BEHAVIOR_SERVICES } from '../generators/exporters/aimCheckDefaults';
import {
  Stack,
  FormControl,
  FormControlLabel,
  FormLabel,
  Input,
  Grid,
  Divider,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { useEditorStore } from '../../../store';
import { numInputSlot } from './right-panel.types';
import NumericInput from '../../../shared/ui/NumericInput';
import {
  RsuPropertiesTextareaStyles,
  type RSUPropertiesProps,
} from './RSUProperties.types';
import {
  formLabelStyles,
  toggleButtonGroupStyles,
  typographyStyles,
} from '../../../shared/styles/panelStyles';
import type {
  RSU,
  RsuBehaviorService,
} from '../../../store/editor-store.types';
import { parseNumberInputChange } from '../../../shared/utils/numberInput';

function AIMServerEditor({
  service,
  onChange,
}: {
  service: Extract<RsuBehaviorService, { type: 'aim_server' }>;
  onChange: (patch: Partial<typeof service>) => void;
}) {
  const loc = service.control_center_location ?? { x: 0, y: 0, z: 0 };

  return (
    <Stack
      spacing={1}
      sx={{ pl: 1, borderLeft: '2px solid', borderColor: 'warning.main' }}
    >
      <Typography variant="caption" sx={{ fontWeight: 600 }}>
        aim_server
      </Typography>

      <FormControl>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Switch
            size="small"
            checked={service.debug ?? false}
            onChange={(e) => onChange({ debug: e.target.checked })}
          />
          <FormLabel>debug</FormLabel>
        </Box>
      </FormControl>

      <FormControl>
        <FormLabel>control_radius</FormLabel>
        <Input
          size="small"
          type="number"
          slotProps={numInputSlot}
          value={service.control_radius ?? 15}
          onChange={(e) => {
            const parsed_control_radius = parseNumberInputChange(e.target);
            if (
              parsed_control_radius === undefined ||
              isNaN(parsed_control_radius)
            )
              return;
            onChange({ control_radius: parsed_control_radius });
          }}
        />
      </FormControl>

      <FormLabel sx={formLabelStyles}>control_center_location</FormLabel>
      <Grid item container spacing={1}>
        {(['x', 'y', 'z'] as const).map((axis) => (
          <Grid item xs={4} key={axis}>
            <FormControl>
              <FormLabel sx={formLabelStyles}>{axis.toUpperCase()}</FormLabel>
              <Input
                size="small"
                type="number"
                slotProps={numInputSlot}
                value={loc[axis]}
                onChange={(e) => {
                  const parsed_value = parseNumberInputChange(e.target);
                  if (parsed_value === undefined || isNaN(parsed_value)) return;
                  onChange({
                    control_center_location: {
                      ...loc,
                      [axis]: parsed_value,
                    },
                  });
                }}
              />
            </FormControl>
          </Grid>
        ))}
      </Grid>

      <FormControl>
        <FormLabel>model</FormLabel>
        <Input
          size="small"
          value={service.model ?? 'MTP'}
          slotProps={numInputSlot}
          onChange={(e) => onChange({ model: e.target.value })}
        />
      </FormControl>

      <FormControl>
        <FormLabel>underling_model</FormLabel>
        <Input
          size="small"
          value={service.underling_model ?? 'GNN_mtl_gnn'}
          slotProps={numInputSlot}
          onChange={(e) => onChange({ underling_model: e.target.value })}
        />
      </FormControl>

      <FormControl>
        <FormLabel>hidden_channels</FormLabel>
        <Input
          size="small"
          type="number"
          slotProps={numInputSlot}
          value={service.hidden_channels ?? 128}
          onChange={(e) => {
            const parsed_hidden_channels = parseNumberInputChange(e.target);
            if (
              parsed_hidden_channels === undefined ||
              isNaN(parsed_hidden_channels)
            )
              return;
            onChange({ hidden_channels: parsed_hidden_channels });
          }}
        />
      </FormControl>

      <FormControl>
        <FormLabel>weight (path)</FormLabel>
        <Input
          size="small"
          value={service.weight ?? ''}
          slotProps={numInputSlot}
          onChange={(e) => onChange({ weight: e.target.value })}
        />
      </FormControl>

      <FormControl>
        <FormLabel>priority</FormLabel>
        <Input
          size="small"
          type="number"
          slotProps={numInputSlot}
          value={service.priority ?? 1}
          onChange={(e) => onChange({ priority: parseInt(e.target.value) })}
        />
      </FormControl>
    </Stack>
  );
}

export default function RSUProperties({ rsu, onDelete }: RSUPropertiesProps) {
  const updateRSU = useEditorStore((s) => s.updateRSU);

  const [showBehaviorServices, setShowBehaviorServices] = useState(
    (rsu.opencda_behavior_services?.length ?? 0) > 0,
  );
  const [showColor, setShowColor] = useState(rsu.opencda_color != null);
  const [showId, setShowId] = useState(rsu.opencda_id != null);
  const [showName, setShowName] = useState(Boolean(rsu.opencda_name?.trim()));

  const opencda_color =
    rsu.opencda_color ?? ([255, 255, 255] as [number, number, number]);
  const services = rsu.opencda_behavior_services ?? [];
  const aimSvc = services.find(
    (s): s is Extract<RsuBehaviorService, { type: 'aim_server' }> =>
      s.type === 'aim_server',
  );

  const toggleAimServer = (active: boolean) => {
    if (active) {
      updateRSU(rsu.id, {
        opencda_behavior_services: [
          {
            type: 'aim_server',
            debug: true,
            control_radius: 15,
            control_center_location: { x: rsu.x, y: rsu.y, z: rsu.z },
            model: 'MTP',
            underling_model: 'GNN_mtl_gnn',
            hidden_channels: 128,
            weight: 'model_rot_gnn_mtl_np_sumo_0911_e3_1930.pth',
            priority: 1,
          },
        ],
      });
    } else {
      updateRSU(rsu.id, { opencda_behavior_services: [] });
    }
  };

  const updateAimServer = (
    patch: Partial<Extract<RsuBehaviorService, { type: 'aim_server' }>>,
  ) => {
    updateRSU(rsu.id, {
      opencda_behavior_services: services.map((s) =>
        s.type === 'aim_server' ? { ...s, ...patch } : s,
      ) as RsuBehaviorService[],
    });
  };

  return (
    <Stack spacing={2}>
      <Typography variant="subtitle1">RSU Object</Typography>

      <FormLabel>Position</FormLabel>
      <Grid item container spacing={1}>
        {(['x', 'y', 'z'] as const).map((axis) => (
          <Grid item xs={4} key={axis}>
            <FormControl>
              <FormLabel sx={formLabelStyles}>{axis.toUpperCase()}</FormLabel>
              <NumericInput
                value={rsu[axis]}
                onValueChange={(value) => updateRSU(rsu.id, { [axis]: value })}
              />
            </FormControl>
          </Grid>
        ))}
      </Grid>

      <Divider />
      <Typography variant="subtitle2" sx={typographyStyles}>
        V2X Parameters
      </Typography>

      <Grid item container spacing={1}>
        <Grid item xs={6}>
          <FormControl>
            <FormLabel>TX Power (mW)</FormLabel>
            <Input
              size="small"
              type="number"
              slotProps={numInputSlot}
              value={rsu.tx_power ?? 20}
              onChange={(e) => {
                const parsed_tx_power = parseNumberInputChange(e.target);
                if (parsed_tx_power === undefined || isNaN(parsed_tx_power))
                  return;
                updateRSU(rsu.id, { tx_power: parsed_tx_power });
              }}
            />
          </FormControl>
        </Grid>
        <Grid item xs={6}>
          <FormControl>
            <FormLabel>Range (m)</FormLabel>
            <Input
              size="small"
              type="number"
              slotProps={numInputSlot}
              value={rsu.range ?? 500}
              onChange={(e) => {
                const parsed_range = parseNumberInputChange(e.target);
                if (parsed_range === undefined || isNaN(parsed_range)) return;
                updateRSU(rsu.id, { range: parsed_range });
              }}
            />
          </FormControl>
        </Grid>
      </Grid>

      <Grid item container spacing={1}>
        <Grid item xs={6}>
          <FormControl>
            <FormLabel>Frequency (Hz)</FormLabel>
            <Input
              size="small"
              type="number"
              slotProps={numInputSlot}
              value={rsu.frequency ?? 5.9e9}
              onChange={(e) => {
                const parsed_frequency = parseNumberInputChange(e.target);
                if (parsed_frequency === undefined || isNaN(parsed_frequency))
                  return;
                updateRSU(rsu.id, { frequency: parsed_frequency });
              }}
            />
          </FormControl>
        </Grid>
        <Grid item xs={6}>
          <FormControl>
            <FormLabel>Beacon interval (ms)</FormLabel>
            <Input
              size="small"
              type="number"
              slotProps={numInputSlot}
              value={rsu.beacon_interval ?? 1000}
              onChange={(e) => {
                const parsed_beacon_interval = parseNumberInputChange(e.target);
                if (
                  parsed_beacon_interval === undefined ||
                  isNaN(parsed_beacon_interval)
                )
                  return;
                updateRSU(rsu.id, {
                  beacon_interval: parsed_beacon_interval,
                });
              }}
            />
          </FormControl>
        </Grid>
      </Grid>

      <FormControl onClick={(e) => e.stopPropagation()}>
        <FormLabel>Protocol</FormLabel>
        <ToggleButtonGroup
          exclusive
          value={rsu.protocol ?? 'DSRC'}
          onChange={(_, val) => {
            if (val) updateRSU(rsu.id, { protocol: val as 'DSRC' | 'C-V2X' });
          }}
          size="small"
          fullWidth
        >
          {(['DSRC', 'C-V2X'] as const).map((proto) => (
            <ToggleButton
              key={proto}
              value={proto}
              sx={toggleButtonGroupStyles}
            >
              {proto}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </FormControl>

      <Divider />
      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
        OpenCDA Parameters
      </Typography>

      <Button
        size="small"
        variant="outlined"
        onClick={() => {
          setShowId(true);
          setShowBehaviorServices(true);
          const base = AIM_CHECK_RSU_BEHAVIOR_SERVICES[0];
          updateRSU(rsu.id, {
            opencda_id: rsu.opencda_id ?? 1,
            opencda_behavior_services: [
              {
                ...base,
                control_center_location: { x: rsu.x, y: rsu.y, z: rsu.z },
              },
            ],
          });
        }}
      >
        Apply AIM RSU preset
      </Button>

      <FormControlLabel
        control={
          <Switch
            size="small"
            checked={showName}
            onChange={(e) => {
              setShowName(e.target.checked);
              updateRSU(rsu.id, {
                opencda_name: e.target.checked ? 'rsu1' : undefined,
              });
            }}
          />
        }
        label="Custom name (rsu_list)"
      />
      {showName && (
        <FormControl>
          <FormLabel>name</FormLabel>
          <Input
            size="small"
            value={rsu.opencda_name ?? ''}
            slotProps={numInputSlot}
            onChange={(e) =>
              updateRSU(rsu.id, { opencda_name: e.target.value })
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
              updateRSU(rsu.id, {
                opencda_id: e.target.checked ? 1 : undefined,
              });
            }}
          />
        }
        label="Custom RSU id"
      />
      {showId && (
        <FormControl>
          <FormLabel>id (often negative)</FormLabel>
          <Input
            size="small"
            type="number"
            slotProps={numInputSlot}
            value={rsu.opencda_id ?? -1}
            onChange={(e) => {
              const parsed_id = parseNumberInputChange(e.target);
              if (parsed_id === undefined || isNaN(parsed_id)) return;
              updateRSU(rsu.id, { opencda_id: parsed_id });
            }}
          />
        </FormControl>
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Switch
          size="small"
          checked={showColor}
          onChange={(e) => {
            setShowColor(e.target.checked);
            updateRSU(rsu.id, {
              opencda_color: e.target.checked
                ? ([255, 255, 255] as [number, number, number])
                : undefined,
            });
          }}
        />
        <FormLabel>OpenCDA color (RGB)</FormLabel>
      </Box>
      {showColor && (
        <Box
          sx={{ pl: 1, borderLeft: '2px solid', borderColor: 'primary.main' }}
        >
          <Grid item container spacing={1}>
            {([0, 1, 2] as const).map((idx) => {
              const labels = ['R', 'G', 'B'];
              return (
                <Grid item xs={4} key={idx}>
                  <FormControl>
                    <FormLabel sx={formLabelStyles}>{labels[idx]}</FormLabel>
                    <Input
                      size="small"
                      type="number"
                      slotProps={numInputSlot}
                      value={opencda_color[idx]}
                      onChange={(e) => {
                        const val = Math.max(
                          0,
                          Math.min(255, parseInt(e.target.value) || 0),
                        );
                        const next = [...opencda_color] as [
                          number,
                          number,
                          number,
                        ];
                        next[idx] = val;
                        updateRSU(rsu.id, { opencda_color: next });
                      }}
                    />
                  </FormControl>
                </Grid>
              );
            })}
          </Grid>
          <Box
            sx={{
              mt: 1,
              width: 36,
              height: 14,
              backgroundColor: `rgb(${opencda_color[0]}, ${opencda_color[1]}, ${opencda_color[2]})`,
              border: '1px solid #ccc',
            }}
          />
        </Box>
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Switch
          size="small"
          checked={showBehaviorServices}
          onChange={(e) => {
            setShowBehaviorServices(e.target.checked);
            toggleAimServer(e.target.checked);
          }}
        />
        <FormLabel>aim_server behavior service</FormLabel>
      </Box>
      {showBehaviorServices && aimSvc && (
        <AIMServerEditor service={aimSvc} onChange={updateAimServer} />
      )}

      <Accordion>
        <AccordionSummary expandIcon={<KeyboardArrowDownIcon />}>
          <Typography variant="subtitle2">OpenCDA Sensing (CARLA)</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              Perception
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={rsu.opencda_sensing?.perception_activate ?? false}
                  onChange={(e) =>
                    updateRSU(rsu.id, {
                      opencda_sensing: {
                        ...rsu.opencda_sensing,
                        perception_activate: e.target.checked,
                      },
                    })
                  }
                />
              }
              label="Activate (YOLOv5 detection)"
            />

            <FormControl>
              <FormLabel sx={formLabelStyles}>Detection range (m)</FormLabel>
              <Input
                size="small"
                type="number"
                slotProps={numInputSlot}
                value={rsu.opencda_sensing?.detection_range ?? 100}
                onChange={(e) => {
                  const parsed_range = parseNumberInputChange(e.target);
                  if (parsed_range === undefined || isNaN(parsed_range)) return;
                  updateRSU(rsu.id, {
                    opencda_sensing: {
                      ...rsu.opencda_sensing,
                      detection_range: parsed_range,
                    },
                  });
                }}
              />
            </FormControl>

            <Typography variant="caption" color="text.secondary">
              Camera
            </Typography>
            <Grid item container spacing={1}>
              <Grid item xs={6}>
                <FormControl>
                  <FormLabel sx={formLabelStyles}>Visualize (count)</FormLabel>
                  <Input
                    size="small"
                    type="number"
                    slotProps={numInputSlot}
                    value={rsu.opencda_sensing?.camera_visualize ?? 4}
                    onChange={(e) => {
                      const parsed_visualize = parseNumberInputChange(e.target);
                      if (
                        parsed_visualize === undefined ||
                        isNaN(parsed_visualize)
                      )
                        return;
                      updateRSU(rsu.id, {
                        opencda_sensing: {
                          ...rsu.opencda_sensing,
                          camera_visualize: parsed_visualize,
                        },
                      });
                    }}
                  />
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl>
                  <FormLabel sx={formLabelStyles}>Count</FormLabel>
                  <Input
                    size="small"
                    type="number"
                    slotProps={numInputSlot}
                    value={rsu.opencda_sensing?.camera_num ?? 4}
                    onChange={(e) => {
                      const parsed_num = parseNumberInputChange(e.target);
                      if (parsed_num === undefined || isNaN(parsed_num)) return;
                      updateRSU(rsu.id, {
                        opencda_sensing: {
                          ...rsu.opencda_sensing,
                          camera_num: parsed_num,
                        },
                      });
                    }}
                  />
                </FormControl>
              </Grid>
            </Grid>

            <Typography variant="caption" color="text.secondary">
              Lidar
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={rsu.opencda_sensing?.lidar_visualize ?? true}
                  onChange={(e) =>
                    updateRSU(rsu.id, {
                      opencda_sensing: {
                        ...rsu.opencda_sensing,
                        lidar_visualize: e.target.checked,
                      },
                    })
                  }
                />
              }
              label="Visualize lidar points"
            />
            <Grid item container spacing={1}>
              {(
                [
                  { key: 'lidar_channels', label: 'Channels', def: 32 },
                  { key: 'lidar_range', label: 'Range (m)', def: 120 },
                  { key: 'lidar_upper_fov', label: 'Upper FOV°', def: 2 },
                  { key: 'lidar_lower_fov', label: 'Lower FOV°', def: -25 },
                  {
                    key: 'lidar_rotation_frequency',
                    label: 'Rot. Freq.',
                    def: 20,
                  },
                  {
                    key: 'lidar_points_per_second',
                    label: 'Pts/sec',
                    def: 1000000,
                  },
                  {
                    key: 'lidar_dropoff_general_rate',
                    label: 'Dropoff rate',
                    def: 0.3,
                  },
                  {
                    key: 'lidar_dropoff_intensity_limit',
                    label: 'Dropoff int.',
                    def: 0.7,
                  },
                  {
                    key: 'lidar_dropoff_zero_intensity',
                    label: 'Dropoff zero',
                    def: 0.4,
                  },
                  {
                    key: 'lidar_noise_stddev',
                    label: 'Noise stddev',
                    def: 0.02,
                  },
                ] as {
                  key: keyof NonNullable<RSU['opencda_sensing']>;
                  label: string;
                  def: number;
                }[]
              ).map(({ key, label, def }) => (
                <Grid item xs={6} key={key}>
                  <FormControl>
                    <FormLabel sx={formLabelStyles}>{label}</FormLabel>
                    <Input
                      size="small"
                      type="number"
                      slotProps={numInputSlot}
                      value={rsu.opencda_sensing?.[key] ?? def}
                      onChange={(e) => {
                        const parsed_value = parseNumberInputChange(e.target);
                        if (parsed_value === undefined || isNaN(parsed_value))
                          return;
                        updateRSU(rsu.id, {
                          opencda_sensing: {
                            ...rsu.opencda_sensing,
                            [key]: parsed_value,
                          },
                        });
                      }}
                    />
                  </FormControl>
                </Grid>
              ))}
            </Grid>

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              Localization
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={rsu.opencda_sensing?.localization_activate ?? true}
                  onChange={(e) =>
                    updateRSU(rsu.id, {
                      opencda_sensing: {
                        ...rsu.opencda_sensing,
                        localization_activate: e.target.checked,
                      },
                    })
                  }
                />
              }
              label="Activate (GNSS + Kalman Filter)"
            />
            <Grid item container spacing={1}>
              {(
                [
                  {
                    key: 'gnss_noise_alt_stddev',
                    label: 'Alt stddev',
                    def: 0.05,
                  },
                  {
                    key: 'gnss_noise_lat_stddev',
                    label: 'Lat stddev',
                    def: 3e-6,
                  },
                  {
                    key: 'gnss_noise_lon_stddev',
                    label: 'Lon stddev',
                    def: 3e-6,
                  },
                ] as {
                  key: keyof NonNullable<RSU['opencda_sensing']>;
                  label: string;
                  def: number;
                }[]
              ).map(({ key, label, def }) => (
                <Grid item xs={4} key={key}>
                  <FormControl>
                    <FormLabel sx={formLabelStyles}>{label}</FormLabel>
                    <Input
                      size="small"
                      type="number"
                      slotProps={numInputSlot}
                      value={rsu.opencda_sensing?.[key] ?? def}
                      onChange={(e) => {
                        const parsed_value = parseNumberInputChange(e.target);
                        if (parsed_value === undefined || isNaN(parsed_value))
                          return;
                        updateRSU(rsu.id, {
                          opencda_sensing: {
                            ...rsu.opencda_sensing,
                            [key]: parsed_value,
                          },
                        });
                      }}
                    />
                  </FormControl>
                </Grid>
              ))}
            </Grid>
          </Stack>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<KeyboardArrowDownIcon />}>
          <Typography variant="subtitle2">Script</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <FormControl>
            <textarea
              rows={8}
              style={RsuPropertiesTextareaStyles}
              placeholder="// RSU scenario..."
              value={rsu.scenario ?? ''}
              onKeyDown={(e) => e.stopPropagation()}
              onChange={(e) => updateRSU(rsu.id, { scenario: e.target.value })}
            />
          </FormControl>
        </AccordionDetails>
      </Accordion>

      <Button color="error" variant="outlined" onClick={onDelete}>
        Delete RSU
      </Button>
    </Stack>
  );
}
