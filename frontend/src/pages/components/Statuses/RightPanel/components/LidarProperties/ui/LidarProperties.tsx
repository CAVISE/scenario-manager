import { Button } from '@mui/material';
import { Stack, FormControl, FormLabel, Input, Slider, Grid } from '@mui/joy';
import { useEditorStore } from '../../../../../../../store/useEditorStore';
import { numInputSlot } from '../../../types/PanelTypes';
import { ILidarProps } from '../types/LidarPropertiesTypes';

export default function LidarProperties({ lidar, onDelete }: ILidarProps) {
  const updateLidar = useEditorStore(s => s.updateLidar);

  return (
    <Stack spacing={1.5}>
      <FormLabel>Lidar (relative to car)</FormLabel>
      <Grid container spacing={1}>
        {(['x', 'y', 'z'] as const).map(axis => (
          <Grid xs={4} key={axis}>
            <FormControl>
              <FormLabel sx={{ fontSize: 'xs', mb: 0.5 }}>{axis.toUpperCase()}</FormLabel>
              <Input
                size="sm" type="number"
                slotProps={numInputSlot}
                value={lidar[axis].toFixed(2)}
                onChange={e => updateLidar(lidar.id, { [axis]: parseFloat(e.target.value) })}
              />
            </FormControl>
          </Grid>
        ))}
      </Grid>

      <FormControl>
        <FormLabel>Range (m)</FormLabel>
        <Slider
          value={lidar.range} min={5} max={200} step={5}
          valueLabelDisplay="auto"
          onChange={(_, v) => { if (typeof v === 'number') updateLidar(lidar.id, { range: v }); }}
        />
      </FormControl>

      <FormControl>
        <FormLabel>Channels</FormLabel>
        <Slider
          value={lidar.channels} min={1} max={128} step={1}
          valueLabelDisplay="auto"
          marks={[
            { value: 16, label: '16' },
            { value: 32, label: '32' },
            { value: 64, label: '64' },
            { value: 128, label: '128' },
          ]}
          onChange={(_, v) => { if (typeof v === 'number') updateLidar(lidar.id, { channels: v }); }}
        />
      </FormControl>

      <FormControl>
        <FormLabel>Rotation frequency (Hz)</FormLabel>
        <Slider
          value={lidar.rotation_frequency} min={1} max={50} step={1}
          valueLabelDisplay="auto"
          onChange={(_, v) => { if (typeof v === 'number') updateLidar(lidar.id, { rotation_frequency: v }); }}
        />
      </FormControl>

      <Button size="small" color="error" variant="outlined" onClick={onDelete}>
        Delete lidar
      </Button>
    </Stack>
  );
}
