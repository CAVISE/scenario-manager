import { Box, FormLabel, Switch } from '@mui/material';
import { useEditorStore } from '../../../../../../store';
import type { Car } from '../../../../../../store/types/useEditorStoreTypes';
import { RgbEditor } from './RgbEditor';
import { DEFAULT_CAV_COLOR } from '../utils/carOpenCDAHelpers';

interface CarColorSectionProps {
  car: Car;
  showColor: boolean;
  setShowColor: (value: boolean) => void;
}

export function CarColorSection({
  car,
  showColor,
  setShowColor,
}: CarColorSectionProps) {
  const updateCar = useEditorStore((s) => s.updateCar);
  const opencdaColor = car.opencda_color ?? DEFAULT_CAV_COLOR;

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Switch
          size="small"
          checked={showColor}
          onChange={(e) => {
            setShowColor(e.target.checked);
            updateCar(car.id, {
              opencda_color: e.target.checked ? DEFAULT_CAV_COLOR : undefined,
            });
          }}
        />
        <FormLabel>OpenCDA color (RGB)</FormLabel>
      </Box>
      {showColor && (
        <RgbEditor
          color={opencdaColor}
          onChange={(next) => updateCar(car.id, { opencda_color: next })}
        />
      )}
    </>
  );
}
