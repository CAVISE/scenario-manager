import {
  FormControl,
  FormControlLabel,
  FormLabel,
  Input,
  Switch,
} from '@mui/material';
import { useEditorStore } from '@/store';
import type { CarKinematicsSectionProps } from '../types/CarPropertiesTypes';
import { numInputSlot } from '@/shared/utils/numberInputUtils';
import { parseNumberFromEvent } from '../utils/carOpenCDAHelpers';

export function CarKinematicsSection({
  car,
  showMaxSpeed,
  setShowMaxSpeed,
  showCollisionAhead,
  setShowCollisionAhead,
}: CarKinematicsSectionProps) {
  const updateCar = useEditorStore((s) => s.updateCar);

  return (
    <>
      <FormControlLabel
        control={
          <Switch
            size="small"
            checked={showMaxSpeed}
            onChange={(e) => {
              setShowMaxSpeed(e.target.checked);
              updateCar(car.id, {
                opencda_max_speed: e.target.checked ? 60 : undefined,
              });
            }}
          />
        }
        label="Override max_speed (km/h)"
      />
      {showMaxSpeed && (
        <FormControl>
          <FormLabel>max_speed</FormLabel>
          <Input
            size="small"
            type="number"
            slotProps={numInputSlot}
            value={car.opencda_max_speed ?? 60}
            onChange={(e) => {
              const parsed = parseNumberFromEvent(e);
              if (parsed === undefined) return;
              updateCar(car.id, {
                opencda_max_speed: parsed,
              });
            }}
          />
        </FormControl>
      )}

      <FormControlLabel
        control={
          <Switch
            size="small"
            checked={showCollisionAhead}
            onChange={(e) => {
              setShowCollisionAhead(e.target.checked);
              updateCar(car.id, {
                opencda_collision_time_ahead: e.target.checked ? 2 : undefined,
              });
            }}
          />
        }
        label="collision_time_ahead override"
      />
      {showCollisionAhead && (
        <FormControl>
          <FormLabel>collision_time_ahead (s)</FormLabel>
          <Input
            size="small"
            type="number"
            slotProps={numInputSlot}
            value={car.opencda_collision_time_ahead ?? 2}
            onChange={(e) => {
              const parsed = parseNumberFromEvent(e);
              if (parsed === undefined) return;
              updateCar(car.id, {
                opencda_collision_time_ahead: parsed,
              });
            }}
          />
        </FormControl>
      )}
    </>
  );
}
