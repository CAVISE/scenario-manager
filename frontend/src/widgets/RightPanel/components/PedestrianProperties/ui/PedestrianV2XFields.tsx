import {
  FormControl,
  FormLabel,
  Grid,
  Input,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import type { Pedestrian } from '@/entities/pedestrian';
import {
  numInputSlot,
  parseNumberInputChange,
} from '@/shared/utils/numberInputUtils';

interface PedestrianV2XFieldsProps {
  pedestrian: Pedestrian;
  onUpdate: (patch: Partial<Pedestrian>) => void;
}

function updateNumericField(
  value: string,
  field: 'tx_power' | 'beacon_interval' | 'frequency',
  onUpdate: PedestrianV2XFieldsProps['onUpdate']
) {
  const parsed = parseNumberInputChange({ value } as HTMLInputElement);
  if (parsed === undefined || Number.isNaN(parsed)) return;
  onUpdate({ [field]: parsed });
}

export function PedestrianV2XFields({
  pedestrian,
  onUpdate,
}: PedestrianV2XFieldsProps) {
  return (
    <>
      <Grid item container spacing={1}>
        <Grid item xs={6}>
          <FormControl>
            <FormLabel>TX Power (mW)</FormLabel>
            <Input
              size="small"
              type="number"
              slotProps={numInputSlot}
              value={pedestrian.tx_power}
              onChange={(event) =>
                updateNumericField(event.target.value, 'tx_power', onUpdate)
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
              onChange={(event) =>
                updateNumericField(
                  event.target.value,
                  'beacon_interval',
                  onUpdate
                )
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
          onChange={(event) =>
            updateNumericField(event.target.value, 'frequency', onUpdate)
          }
        />
      </FormControl>

      <FormControl onClick={(event) => event.stopPropagation()}>
        <FormLabel>Protocol</FormLabel>
        <ToggleButtonGroup
          exclusive
          value={pedestrian.protocol}
          onChange={(_, value) => {
            if (value) onUpdate({ protocol: value as 'DSRC' | 'C-V2X' });
          }}
          size="small"
          fullWidth
        >
          {(['DSRC', 'C-V2X'] as const).map((protocol) => (
            <ToggleButton
              key={protocol}
              value={protocol}
              className="right-panel-property-toggle"
            >
              {protocol}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </FormControl>
    </>
  );
}
