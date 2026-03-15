import React from 'react';
import { Button } from '@mui/material';
import {
  Stack, FormControl, FormLabel, Input, Slider, Grid, Divider, Typography,
} from '@mui/joy';
import { Box } from '@mui/material';
import { HexColorPicker } from 'react-colorful';
import { useEditorStore } from '../../../../../store/useEditorStore';
import { numInputSlot } from '../types/PanelTypes';
import CarLidarList from './CarLidarList';
import { CarPropertiesProps } from './types/CarPropertiesTypes';


export default function CarProperties({ car, onDelete, onDetach }: CarPropertiesProps) {
  const updateCar = useEditorStore(s => s.updateCar);
  const lidars    = useEditorStore(s => s.lidars);
  const carLidars = lidars.filter(l => l.carId === car.id);

  return (
    <Stack spacing={2}>
      <FormControl>
        <FormLabel>Car name</FormLabel>
        <Input
          value={car.model ?? ''}
          slotProps={{ input: { onKeyDown: (e: React.KeyboardEvent) => e.stopPropagation() } }}
          onChange={e => { onDetach(); updateCar(car.id, { model: e.target.value }); }}
        />
      </FormControl>

      <FormLabel>Position</FormLabel>
      <Grid container spacing={1}>
        {(['x', 'y', 'z'] as const).map(axis => (
          <Grid xs={4} key={axis}>
            <FormControl>
              <FormLabel sx={{ fontSize: 'xs', mb: 0.5 }}>{axis.toUpperCase()}</FormLabel>
              <Input
                size="sm" type="number"
                slotProps={numInputSlot}
                value={car[axis].toFixed(3)}
                onChange={e => { onDetach(); updateCar(car.id, { [axis]: parseFloat(e.target.value) }); }}
              />
            </FormControl>
          </Grid>
        ))}
      </Grid>

      <FormControl>
        <FormLabel>Size</FormLabel>
        <Slider
          value={car.scale ?? 1} min={0.1} max={5} step={0.1}
          valueLabelDisplay="auto"
          onChange={(_, v) => { if (typeof v === 'number') updateCar(car.id, { scale: v }); }}
        />
      </FormControl>

      <FormControl>
        <FormLabel>Speed (km/h)</FormLabel>
        <Slider
          value={car.speed ?? 50} min={0} max={250} step={1}
          valueLabelDisplay="auto"
          onChange={(_, v) => { if (typeof v === 'number') updateCar(car.id, { speed: v }); }}
        />
      </FormControl>

      <FormControl
        onPointerDown={e => e.stopPropagation()}
        onMouseDown={e => e.stopPropagation()}
        onClick={e => e.stopPropagation()}
      >
        <FormLabel>Color</FormLabel>
        <HexColorPicker
          color={`#${car.color ?? '00ff00'}`}
          onChange={hex => updateCar(car.id, { color: hex.replace('#', '') })}
        />
        <Box sx={{ mt: 1, width: 36, height: 14, backgroundColor: `#${car.color ?? '00ff00'}`, border: '1px solid #ccc' }} />
        <Typography level="body-sm" sx={{ mt: 0.5 }}>Current color: #{car.color ?? '00ff00'}</Typography>
      </FormControl>

      <Divider />

      <CarLidarList carId={car.id} lidars={carLidars} onDetach={onDetach} />

      <Button color="error" variant="outlined" onClick={onDelete}>
        Delete car
      </Button>
    </Stack>
  );
}
