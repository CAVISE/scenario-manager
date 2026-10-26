import { FormControl, FormLabel, Grid } from '@mui/material';
import NumericInput from '../../../NumericInput';
import type { PositionSectionProps } from '../../types/RSUPropertiesTypes';
import '../../../../styles/PropertyFields.scss';

export function PositionSection({ rsu, updateRSU }: PositionSectionProps) {
  return (
    <>
      <FormLabel>Position</FormLabel>
      <Grid container spacing={1}>
        {(['x', 'y', 'z'] as const).map((axis) => (
          <Grid key={axis} size={4}>
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
