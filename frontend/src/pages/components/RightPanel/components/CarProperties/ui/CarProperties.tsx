import { Button } from '@mui/material';
import {
  Stack,
  FormControl,
  FormLabel,
  Input,
  Slider,
  Grid,
  Divider,
  Typography,
} from '@mui/material';
import { Box } from '@mui/material';
import { HexColorPicker } from 'react-colorful';
import { useEditorStore } from '@/store';
import CarLidarList from '../../CarLidarList';
import NumericInput from '../../NumericInput';
import CarOpenCDASection from './CarOpenCDASection';
import CarOpenCDARareSection from './CarOpenCDARareSection';
import { CarPropertiesProps } from '../types/CarPropertiesTypes';
import {
  formLabelStyles,
  DEFAULT_CAR_COLOR,
} from '@/shared/styles/panelStyles';
import { numInputSlot } from '@right-panel/types/PanelTypes';

export default function CarProperties({ car, onDelete }: CarPropertiesProps) {
  const updateCar = useEditorStore((s) => s.updateCar);
  const lidars = useEditorStore((s) => s.lidars);
  const carLidars = lidars.filter((l) => l.carId === car.id);

  return (
    <Stack spacing={2}>
      <FormControl>
        <FormLabel>Car name</FormLabel>
        <Input
          value={car.model ?? ''}
          slotProps={numInputSlot}
          onChange={(e) => {
            updateCar(car.id, { model: e.target.value });
          }}
        />
      </FormControl>

      <FormLabel>Position</FormLabel>
      <Grid item container spacing={1}>
        {(['x', 'y', 'z'] as const).map((axis) => (
          <Grid item xs={4} key={axis}>
            <FormControl>
              <FormLabel sx={formLabelStyles}>{axis.toUpperCase()}</FormLabel>
              <NumericInput
                value={car[axis]}
                onValueChange={(value) => updateCar(car.id, { [axis]: value })}
              />
            </FormControl>
          </Grid>
        ))}
      </Grid>

      <FormControl>
        <FormLabel>Size</FormLabel>
        <Slider
          value={car.scale ?? 1}
          min={0.1}
          max={5}
          step={0.1}
          valueLabelDisplay="auto"
          onChange={(_, v) => {
            if (typeof v === 'number') updateCar(car.id, { scale: v });
          }}
        />
      </FormControl>

      <FormControl>
        <FormLabel>Speed (km/h)</FormLabel>
        <Slider
          value={car.speed ?? 50}
          min={0}
          max={250}
          step={1}
          valueLabelDisplay="auto"
          onChange={(_, v) => {
            if (typeof v === 'number') updateCar(car.id, { speed: v });
          }}
        />
      </FormControl>

      <FormControl
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <FormLabel>Color</FormLabel>
        <HexColorPicker
          color={`#${car.color ?? DEFAULT_CAR_COLOR}`}
          onChange={(hex) => updateCar(car.id, { color: hex.replace('#', '') })}
        />
        <Box
          sx={{
            mt: 1,
            width: 36,
            height: 14,
            backgroundColor: `#${car.color ?? DEFAULT_CAR_COLOR}`,
            border: '1px solid #ccc',
          }}
        />
        <Typography variant="body2" sx={{ mt: 0.5 }}>
          Current color: #{car.color ?? DEFAULT_CAR_COLOR}
        </Typography>
      </FormControl>

      <CarOpenCDASection car={car} />
      <CarOpenCDARareSection car={car} />

      <Divider />

      <CarLidarList carId={car.id} lidars={carLidars} />

      <Button color="error" variant="outlined" onClick={onDelete}>
        Delete car
      </Button>
    </Stack>
  );
}
