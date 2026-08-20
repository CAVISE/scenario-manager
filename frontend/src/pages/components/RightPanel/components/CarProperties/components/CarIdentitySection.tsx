import {
  FormControl,
  FormControlLabel,
  FormLabel,
  Input,
  Switch,
} from '@mui/material';
import { useEditorStore } from '@/store';
import type { Car } from '@/store/types/useEditorStoreTypes';
import { parseNumberFromEvent } from '../utils/carOpenCDAHelpers';
import { numInputSlot } from '@editor/components/SimConfigModal/tabs/ui/opencda/utils/opencdaFieldUtils';

interface CarIdentitySectionProps {
  car: Car;
  showName: boolean;
  setShowName: (value: boolean) => void;
  showId: boolean;
  setShowId: (value: boolean) => void;
}

export function CarIdentitySection({
  car,
  showName,
  setShowName,
  showId,
  setShowId,
}: CarIdentitySectionProps) {
  const updateCar = useEditorStore((s) => s.updateCar);

  return (
    <>
      <FormControlLabel
        control={
          <Switch
            size="small"
            checked={showName}
            onChange={(e) => {
              setShowName(e.target.checked);
              updateCar(car.id, {
                opencda_name: e.target.checked ? 'cav1' : undefined,
              });
            }}
          />
        }
        label="Custom name (single_cav_list)"
      />
      {showName && (
        <FormControl>
          <FormLabel>name</FormLabel>
          <Input
            size="small"
            value={car.opencda_name ?? ''}
            slotProps={numInputSlot}
            onChange={(e) =>
              updateCar(car.id, { opencda_name: e.target.value })
            }
          />
        </FormControl>
      )}

      <FormControlLabel
        control={
          <Switch
            size="small"
            checked={showId}
            onChange={(e) => {
              setShowId(e.target.checked);
              updateCar(car.id, {
                opencda_id: e.target.checked ? 100 : undefined,
              });
            }}
          />
        }
        label="Custom CAV id"
      />
      {showId && (
        <FormControl>
          <FormLabel>id (numeric)</FormLabel>
          <Input
            size="small"
            type="number"
            slotProps={numInputSlot}
            value={car.opencda_id ?? 100}
            onChange={(e) => {
              const parsed = parseNumberFromEvent(e);
              if (parsed === undefined) return;
              updateCar(car.id, {
                opencda_id: parsed,
              });
            }}
          />
        </FormControl>
      )}
    </>
  );
}
