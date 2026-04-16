import { Button, ToggleButtonGroup, ToggleButton } from '@mui/material';
import {
  Stack, FormControl, FormLabel, Input, Grid, Divider, Typography,
} from '@mui/joy';
import { useEditorStore } from '../../../../../../../store/useEditorStore';
import { numInputSlot } from '../../../types/PanelTypes';
import { IPedestrianProps } from '../types/PedestrianPropertiesTypes';



export default function PedestrianProperties({ pedestrian, onDelete }: IPedestrianProps) {
  const updatePedestrian = useEditorStore(s => s.updatePedestrian);

  return (
    <Stack spacing={2}>
      <Typography level="title-sm">Pedestrian</Typography>

      <FormLabel>Position</FormLabel>
      <Grid container spacing={1}>
        {(['x', 'y', 'z'] as const).map(axis => (
          <Grid xs={4} key={axis}>
            <FormControl>
              <FormLabel sx={{ fontSize: 'xs', mb: 0.5 }}>{axis.toUpperCase()}</FormLabel>
              <Input
                size="sm"
                type="number"
                slotProps={numInputSlot}
                value={pedestrian[axis].toFixed(3)}
                onChange={e =>
                  updatePedestrian(pedestrian.id, {
                    [axis]: parseFloat(e.target.value),
                  })
                }
              />
            </FormControl>
          </Grid>
        ))}
      </Grid>

      <Divider />
      <Typography level="title-sm" sx={{ color: 'text.secondary' }}>Behavior</Typography>

      <FormControl>
        <FormLabel>Speed (m/s)</FormLabel>
        <Input
          size="sm"
          type="number"
          slotProps={numInputSlot}
          value={pedestrian.speed}
          onChange={e =>
            updatePedestrian(pedestrian.id, {
              speed: parseFloat(e.target.value),
            })
          }
        />
      </FormControl>

      <FormControl>
        <FormLabel>Cross factor (0–1)</FormLabel>
        <Input
          size="sm"
          type="number"
          slotProps={numInputSlot}
          value={pedestrian.cross_factor}
          onChange={e =>
            updatePedestrian(pedestrian.id, {
              cross_factor: parseFloat(e.target.value),
            })
          }
        />
      </FormControl>

      <FormControl>
        <FormLabel>Collisions</FormLabel>
        <ToggleButtonGroup
          value={pedestrian.is_invincible ? 'on' : 'off'}
          exclusive
          size="small"
          onChange={(_, val) => {
            if (!val) return;
            updatePedestrian(pedestrian.id, { is_invincible: val === 'on' });
          }}
          fullWidth
        >
          <ToggleButton value="off" sx={{ flex: 1 }}>Collidable</ToggleButton>
          <ToggleButton value="on" sx={{ flex: 1 }}>Invincible</ToggleButton>
        </ToggleButtonGroup>
      </FormControl>

      <Divider />
      <Typography level="title-sm" sx={{ color: 'text.secondary' }}>V2X</Typography>

      <Grid container spacing={1}>
        <Grid xs={6}>
          <FormControl>
            <FormLabel>TX Power (mW)</FormLabel>
            <Input
              size="sm"
              type="number"
              slotProps={numInputSlot}
              value={pedestrian.tx_power}
              onChange={e =>
                updatePedestrian(pedestrian.id, {
                  tx_power: parseFloat(e.target.value),
                })
              }
            />
          </FormControl>
        </Grid>
        <Grid xs={6}>
          <FormControl>
            <FormLabel>Beacon interval (ms)</FormLabel>
            <Input
              size="sm"
              type="number"
              slotProps={numInputSlot}
              value={pedestrian.beacon_interval}
              onChange={e =>
                updatePedestrian(pedestrian.id, {
                  beacon_interval: parseFloat(e.target.value),
                })
              }
            />
          </FormControl>
        </Grid>
      </Grid>

      <FormControl>
        <FormLabel>Frequency (Hz)</FormLabel>
        <Input
          size="sm"
          type="number"
          slotProps={numInputSlot}
          value={pedestrian.frequency}
          onChange={e =>
            updatePedestrian(pedestrian.id, {
              frequency: parseFloat(e.target.value),
            })
          }
        />
      </FormControl>

      <FormControl onClick={e => e.stopPropagation()}>
        <FormLabel>Protocol</FormLabel>
        <ToggleButtonGroup
          exclusive
          value={pedestrian.protocol}
          onChange={(_, val) => {
            if (val) updatePedestrian(pedestrian.id, { protocol: val as 'DSRC' | 'C-V2X' });
          }}
          size="small"
          fullWidth
        >
          {(['DSRC', 'C-V2X'] as const).map(proto => (
            <ToggleButton key={proto} value={proto} sx={{ flex: 1 }}>
              {proto}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </FormControl>

      <Button color="error" variant="outlined" onClick={onDelete}>
        Delete pedestrian
      </Button>
    </Stack>
  );
}

