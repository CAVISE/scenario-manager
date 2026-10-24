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
import { useEditorStore } from '@/store';
import { numInputSlot } from '@/shared/utils/numberInputUtils';
import NumericInput from '../../NumericInput';
import { IPedestrianProps } from '../types/PedestrianPropertiesTypes';
import { parseNumberInputChange } from '@/shared/utils/numberInputUtils';
import { usePropertiesMode } from '../../../context/PropertiesModeContext';
import { PedestrianV2XFields } from './PedestrianV2XFields';
import '../../../styles/PropertyFields.scss';

function clampCrossFactor(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export default function PedestrianProperties({
  pedestrian,
  onDelete,
}: IPedestrianProps) {
  const updatePedestrian = useEditorStore((s) => s.updatePedestrian);
  const propertiesMode = usePropertiesMode();

  return (
    <Stack spacing={2}>
      <Typography variant="subtitle1">Pedestrian</Typography>

      <FormLabel>Position</FormLabel>
      <Grid item container spacing={1}>
        {(['x', 'y', 'z'] as const).map((axis) => (
          <Grid item xs={4} key={axis}>
            <FormControl>
              <FormLabel className="right-panel-property-label">
                {axis.toUpperCase()}
              </FormLabel>
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
      <Typography variant="subtitle2" className="right-panel-property-heading">
        Behavior
      </Typography>

      <FormControl>
        <FormLabel>Speed (m/s)</FormLabel>
        <Input
          size="small"
          type="number"
          slotProps={numInputSlot}
          value={pedestrian.speed}
          onChange={(e) => {
            const parsed_speed = parseNumberInputChange(e.target);
            if (parsed_speed === undefined || isNaN(parsed_speed)) return;
            updatePedestrian(pedestrian.id, {
              speed: parsed_speed,
            });
          }}
        />
      </FormControl>

      <FormControl>
        <FormLabel>Cross factor (0–1)</FormLabel>
        <Input
          size="small"
          type="number"
          slotProps={numInputSlot}
          value={pedestrian.cross_factor}
          onChange={(e) => {
            const parsed_cross_factor = parseNumberInputChange(e.target);
            if (parsed_cross_factor === undefined || isNaN(parsed_cross_factor))
              return;
            const clamped = clampCrossFactor(parsed_cross_factor);
            updatePedestrian(pedestrian.id, {
              cross_factor: clamped,
            });
          }}
          onBlur={(e) => {
            const parsed_cross_factor = parseNumberInputChange(e.target);
            if (
              parsed_cross_factor === undefined ||
              isNaN(parsed_cross_factor)
            ) {
              return;
            }
            const clamped = clampCrossFactor(parsed_cross_factor);
            if (clamped !== pedestrian.cross_factor) {
              updatePedestrian(pedestrian.id, {
                cross_factor: clamped,
              });
            }
          }}
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
          <ToggleButton value="off" className="right-panel-property-toggle">
            Collidable
          </ToggleButton>
          <ToggleButton value="on" className="right-panel-property-toggle">
            Invincible
          </ToggleButton>
        </ToggleButtonGroup>
      </FormControl>

      {propertiesMode === 'advanced' && (
        <>
          <Divider />
          <Typography
            variant="subtitle2"
            className="right-panel-property-heading"
          >
            V2X
          </Typography>

          <PedestrianV2XFields
            pedestrian={pedestrian}
            onUpdate={(patch) => updatePedestrian(pedestrian.id, patch)}
          />
        </>
      )}

      <Button color="error" variant="outlined" onClick={onDelete}>
        Delete pedestrian
      </Button>
    </Stack>
  );
}
