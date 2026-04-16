import { Button } from '@mui/material';
import { Stack, FormControl, FormLabel, Input, Grid, Typography } from '@mui/joy';
import { useEditorStore } from '../../../../../../../store/useEditorStore';
import { RoutePointPropertiesProps } from '../types/RoutePointPropertiesTypes';



export default function RoutePointProperties({ point, onDelete }: RoutePointPropertiesProps) {
  const updatePoint = useEditorStore(s => s.updatePoint);

  return (
    <Stack spacing={2}>
      <Typography level="title-sm">Route point</Typography>

      <FormLabel>Position</FormLabel>
      <Grid container spacing={1}>
        {(['x', 'y', 'z'] as const).map(axis => (
          <Grid xs={4} key={axis}>
            <FormControl>
              <FormLabel sx={{ fontSize: 'xs', mb: 0.5 }}>{axis.toUpperCase()}</FormLabel>
              <Input
                size="sm" type="number"
                slotProps={{ input: { onKeyDown: (e: React.KeyboardEvent) => e.stopPropagation() } }}
                value={point[axis].toFixed(3)}  
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  if (!isNaN(value)) updatePoint(point.id, { [axis]: value });
                }}
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
