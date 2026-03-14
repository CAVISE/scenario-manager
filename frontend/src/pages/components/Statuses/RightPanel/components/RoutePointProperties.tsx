import { Button } from '@mui/material';
import { Stack, FormControl, FormLabel, Input, Grid, Typography } from '@mui/joy';
import { numInputSlot } from '../types/PanelTypes';
import { RoutePointPropertiesProps } from './types/RoutePointPropertiesTypes';



export default function RoutePointProperties({ selectedObject, onDelete }: RoutePointPropertiesProps) {
  return (
    <Stack spacing={2}>
      <Typography level="title-sm">Route point</Typography>

      {selectedObject?.position && (
        <>
          <FormLabel>Position</FormLabel>
          <Grid container spacing={1}>
            {(['x', 'y', 'z'] as const).map(axis => (
              <Grid xs={4} key={axis}>
                <FormControl>
                  <FormLabel sx={{ fontSize: 'xs', mb: 0.5 }}>{axis.toUpperCase()}</FormLabel>
                  <Input
                    size="sm" type="number" readOnly
                    slotProps={numInputSlot}
                    value={selectedObject.position![axis].toFixed(3)}
                  />
                </FormControl>
              </Grid>
            ))}
          </Grid>
        </>
      )}

      <Button color="error" variant="outlined" onClick={onDelete}>
        Delete point
      </Button>
    </Stack>
  );
}