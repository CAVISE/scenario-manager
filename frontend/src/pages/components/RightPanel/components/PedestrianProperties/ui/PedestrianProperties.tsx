import { Button, ToggleButtonGroup, ToggleButton } from '@mui/material';
import {
  Stack,
  FormControl,
  FormLabel,
  Input,
  Grid,
  Divider,
  Typography,
} from '@mui/material';
import { useEditorStore } from '../../../../../../store';
import { numInputSlot } from '../../../types/PanelTypes';
import NumericInput from '../../NumericInput';
import { IPedestrianProps } from '../types/PedestrianPropertiesTypes';
import {
  toggleButtonStyles,
  typographyStyles,
} from '../../BuildingProperties/types/BuildingPropertiesTypes';
import { formLabelStyles } from '../../CarProperties/types/CarPropertiesTypes';

export default function PedestrianProperties({
  pedestrian,
  onDelete,
}: IPedestrianProps) {
  const updatePedestrian = useEditorStore((s) => s.updatePedestrian);

  return (
    <Stack spacing={2}>
      <Typography variant="subtitle1">Pedestrian</Typography>

      <FormLabel>Position</FormLabel>
      <Grid item container spacing={1}>
        {(['x', 'y', 'z'] as const).map((axis) => (
          <Grid item xs={4} key={axis}>
            <FormControl>
              <FormLabel sx={formLabelStyles}>{axis.toUpperCase()}</FormLabel>
              <NumericInput
                value={pedestrian[axis]}
                onValueChange={(value) =>
                  updatePedestrian(pedestrian.id, { [axis]: value })
                }
              />
            </FormControl>
          </Grid>
        ))}
      </Grid>

      <Divider />
      <Typography variant="subtitle2" sx={typographyStyles}>
        Behavior
      </Typography>

      <FormControl>
        <FormLabel>Speed (m/s)</FormLabel>
        <Input
          size="small"
          type="number"
          slotProps={numInputSlot}
          value={pedestrian.speed}
          onChange={(e) =>
            updatePedestrian(pedestrian.id, {
              speed: parseFloat(e.target.value),
            })
          }
        />
      </FormControl>

      <FormControl>
        <FormLabel>Cross factor (0–1)</FormLabel>
        <Input
          size="small"
          type="number"
          slotProps={numInputSlot}
          value={pedestrian.cross_factor}
          onChange={(e) =>
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
          <ToggleButton value="off" sx={toggleButtonStyles}>
            Collidable
          </ToggleButton>
          <ToggleButton value="on" sx={toggleButtonStyles}>
            Invincible
          </ToggleButton>
        </ToggleButtonGroup>
      </FormControl>

      <Divider />
      <Typography variant="subtitle2" sx={typographyStyles}>
        V2X
      </Typography>

      <Grid item container spacing={1}>
        <Grid item xs={6}>
          <FormControl>
            <FormLabel>TX Power (mW)</FormLabel>
            <Input
              size="small"
              type="number"
              slotProps={numInputSlot}
              value={pedestrian.tx_power}
              onChange={(e) =>
                updatePedestrian(pedestrian.id, {
                  tx_power: parseFloat(e.target.value),
                })
              }
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
              value={pedestrian.beacon_interval}
              onChange={(e) =>
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
          size="small"
          type="number"
          slotProps={numInputSlot}
          value={pedestrian.frequency}
          onChange={(e) =>
            updatePedestrian(pedestrian.id, {
              frequency: parseFloat(e.target.value),
            })
          }
        />
      </FormControl>

      <FormControl onClick={(e) => e.stopPropagation()}>
        <FormLabel>Protocol</FormLabel>
        <ToggleButtonGroup
          exclusive
          value={pedestrian.protocol}
          onChange={(_, val) => {
            if (val)
              updatePedestrian(pedestrian.id, {
                protocol: val as 'DSRC' | 'C-V2X',
              });
          }}
          size="small"
          fullWidth
        >
          {(['DSRC', 'C-V2X'] as const).map((proto) => (
            <ToggleButton key={proto} value={proto} sx={toggleButtonStyles}>
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
