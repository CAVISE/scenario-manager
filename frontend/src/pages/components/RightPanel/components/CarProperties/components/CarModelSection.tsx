import {
  FormControl,
  FormControlLabel,
  FormLabel,
  Input,
  Switch,
} from '@mui/material';
import { useEditorStore } from '../../../../../../store';
import type { Car } from '../../../../../../store/types/useEditorStoreTypes';
import { numInputSlot } from '../../../types/PanelTypes';

interface CarModelSectionProps {
  car: Car;
  showModel: boolean;
  setShowModel: (value: boolean) => void;
}

export function CarModelSection({
  car,
  showModel,
  setShowModel,
}: CarModelSectionProps) {
  const updateCar = useEditorStore((s) => s.updateCar);

  return (
    <>
      <FormControlLabel
        control={
          <Switch
            size="small"
            checked={showModel}
            onChange={(e) => {
              setShowModel(e.target.checked);
              updateCar(car.id, {
                opencda_carla_model: e.target.checked
                  ? 'vehicle.lincoln.mkz_2017'
                  : undefined,
              });
            }}
          />
        }
        label="CARLA blueprint (model)"
      />
      {showModel && (
        <FormControl>
          <FormLabel>model</FormLabel>
          <Input
            size="small"
            value={car.opencda_carla_model ?? ''}
            slotProps={numInputSlot}
            onChange={(e) =>
              updateCar(car.id, { opencda_carla_model: e.target.value })
            }
          />
        </FormControl>
      )}
    </>
  );
}
