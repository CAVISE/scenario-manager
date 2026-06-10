import React, { useState } from 'react';
import { Button, ToggleButtonGroup, ToggleButton, Switch } from '@mui/material';
import { AIM_CHECK_RSU_BEHAVIOR_SERVICES } from '../../../../../Editor/Generators/exporters/aimCheckDefaults';
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
import { useEditorStore } from '../../../../../../store';
import { numInputSlot } from '../../../types/PanelTypes';
import {
  RsuPropertiesTextareaStyles,
  type RSUPropertiesProps,
} from '../types/RSUPropertiesTypes';
import { formLabelStyles } from '../../CarProperties/types/CarPropertiesTypes';
import {
  toggleButtonGroupStyles,
  typographyStyles,
} from '../../BuildingProperties/types/BuildingPropertiesTypes';
import type { RsuBehaviorService } from '../../../../../../store/types/useEditorStoreTypes';

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
          onChange={(e) =>
            onChange({ control_radius: parseFloat(e.target.value) })
          }
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
                onChange={(e) =>
                  onChange({
                    control_center_location: {
                      ...loc,
                      [axis]: parseFloat(e.target.value),
                    },
                  })
                }
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
          slotProps={{
            input: {
              onKeyDown: (e: React.KeyboardEvent) => e.stopPropagation(),
            },
          }}
          onChange={(e) => onChange({ model: e.target.value })}
        />
      </FormControl>

      <FormControl>
        <FormLabel>underling_model</FormLabel>
        <Input
          size="small"
          value={service.underling_model ?? 'GNN_mtl_gnn'}
          slotProps={{
            input: {
              onKeyDown: (e: React.KeyboardEvent) => e.stopPropagation(),
            },
          }}
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
          onChange={(e) =>
            onChange({ hidden_channels: parseInt(e.target.value) })
          }
        />
      </FormControl>

      <FormControl>
        <FormLabel>weight (path)</FormLabel>
        <Input
          size="small"
          value={service.weight ?? ''}
          slotProps={{
            input: {
              onKeyDown: (e: React.KeyboardEvent) => e.stopPropagation(),
            },
          }}
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
              <Input
                size="small"
                type="number"
                slotProps={numInputSlot}
                value={rsu[axis].toFixed(3)}
                onChange={(e) =>
                  updateRSU(rsu.id, { [axis]: parseFloat(e.target.value) })
                }
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
              onChange={(e) =>
                updateRSU(rsu.id, { tx_power: parseFloat(e.target.value) })
              }
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
              onChange={(e) =>
                updateRSU(rsu.id, { range: parseFloat(e.target.value) })
              }
            />
          </FormControl>
        </Grid>
      </Grid>

      <FormControl>
        <FormLabel>Frequency (Hz)</FormLabel>
        <Input
          size="small"
          type="number"
          slotProps={numInputSlot}
          value={rsu.frequency ?? 5.9e9}
          onChange={(e) =>
            updateRSU(rsu.id, { frequency: parseFloat(e.target.value) })
          }
        />
      </FormControl>

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
            slotProps={{
              input: {
                onKeyDown: (e: React.KeyboardEvent) => e.stopPropagation(),
              },
            }}
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
            onChange={(e) =>
              updateRSU(rsu.id, {
                opencda_id: parseInt(e.target.value, 10) || -1,
              })
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
          <Typography variant="subtitle2">Script</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <FormControl>
            <textarea
              rows={8}
              style={RsuPropertiesTextareaStyles}
              placeholder="// RSU script..."
              value={rsu.script ?? ''}
              onKeyDown={(e) => e.stopPropagation()}
              onChange={(e) => updateRSU(rsu.id, { script: e.target.value })}
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
