import { FormControl, FormLabel, Grid } from '@mui/material';
import NumericInput from '../../../NumericInput';
import type { PositionSectionProps } from '../../types/RSUPropertiesTypes';
import '../../../../styles/PropertyFields.scss';

export function PositionSection({ rsu, updateRSU }: PositionSectionProps) {
  return (
    <>
      <FormLabel>Position</FormLabel>
      <Grid item container spacing={1}>
        {(['x', 'y', 'z'] as const).map((axis) => (
          <Grid item xs={4} key={axis}>
            <FormControl>
              <FormLabel className="right-panel-property-label">
                {axis.toUpperCase()}
              </FormLabel>
              <NumericInput
                value={rsu[axis]}
                onValueChange={(value) => updateRSU(rsu.id, { [axis]: value })}
              />
            </FormControl>
          </Grid>
        ))}
      </Grid>
    </>
  );
}
