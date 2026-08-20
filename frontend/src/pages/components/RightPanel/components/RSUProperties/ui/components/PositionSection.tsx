import { FormControl, FormLabel, Grid } from '@mui/material';
import { RSU } from '@/store/types/useEditorStoreTypes';
import { formLabelStyles } from '@/shared/styles/panelStyles';
import NumericInput from '../../../NumericInput';

interface PositionSectionProps {
  rsu: RSU;
  updateRSU: (id: string, props: Partial<RSU>) => void;
}

export function PositionSection({ rsu, updateRSU }: PositionSectionProps) {
  return (
    <>
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
    </>
  );
}
