import { Button } from '@mui/material';
import { Stack, FormControl, FormLabel, Grid, Typography } from '@mui/material';
import { useEditorStore } from '@/store';
import '../../../styles/PropertyFields.scss';
import NumericInput from '../../NumericInput';
import { RoutePointPropertiesProps } from '../types/RoutePointPropertiesTypes';

export default function RoutePointProperties({
  point,
  onDelete,
}: RoutePointPropertiesProps) {
  const updatePoint = useEditorStore((s) => s.updatePoint);

  return (
    <Stack spacing={2}>
      <Typography variant="subtitle1">Route point</Typography>

      <FormLabel>Position</FormLabel>
      <Grid container spacing={1}>
        {(['x', 'y', 'z'] as const).map((axis) => (
          <Grid key={axis} size={4}>
            <FormControl>
              <FormLabel className="right-panel-property-label">
                {axis.toUpperCase()}
              </FormLabel>
              <NumericInput
                value={point[axis]}
                onValueChange={(value) =>
                  updatePoint(point.id, { [axis]: value })
                }
              />
            </FormControl>
          </Grid>
        ))}
      </Grid>

      <Button color="error" variant="outlined" onClick={onDelete}>
        Delete point
      </Button>
    </Stack>
  );
}
