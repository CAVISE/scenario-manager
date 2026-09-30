import {
  Divider,
  FormControl,
  FormLabel,
  Grid,
  Input,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { parseNumberInputChange } from '@/shared/utils/numberInputUtils';
import { numInputSlot } from '@/shared/utils/numberInputUtils';
import type { V2XParametersSectionProps } from '../../types/RSUPropertiesTypes';
import '../../../../styles/PropertyFields.scss';

export function V2XParametersSection({
  rsu,
  updateRSU,
}: V2XParametersSectionProps) {
  return (
    <>
      <Divider />
      <Typography variant="subtitle2" className="right-panel-property-heading">
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
              className="right-panel-property-toggle"
            >
              {proto}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </FormControl>
    </>
  );
}
