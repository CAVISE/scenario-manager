import {
  FormControl,
  FormControlLabel,
  FormLabel,
  Input,
  Stack,
  Switch,
} from '@mui/material';
import type { Car } from '@/entities/vehicle';
import {
  numInputSlot,
  parseNumberInputChange,
} from '@/shared/utils/numberInputUtils';

interface CarOpenCDASensingFieldsProps {
  sensing: NonNullable<Car['opencda_sensing']>;
  onUpdate: (patch: Partial<NonNullable<Car['opencda_sensing']>>) => void;
}

function SensingNumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
}) {
  return (
    <FormControl>
      <FormLabel className="car-properties-section__label">{label}</FormLabel>
      <Input
        size="small"
        type="number"
        slotProps={numInputSlot}
        value={value ?? ''}
        placeholder="default"
        onChange={(event) =>
          onChange(
            event.target.value
              ? parseNumberInputChange(event.target)
              : undefined
          )
        }
      />
    </FormControl>
  );
}

export function CarOpenCDASensingFields({
  sensing,
  onUpdate,
}: CarOpenCDASensingFieldsProps) {
  return (
    <Stack spacing={1} className="car-properties-section__nested-compact">
      <FormControlLabel
        control={
          <Switch
            size="small"
            checked={sensing.perception_activate ?? false}
            onChange={(event) =>
              onUpdate({ perception_activate: event.target.checked })
            }
          />
        }
        label="perception.activate"
      />
      <SensingNumberField
        label="camera.visualize"
        value={sensing.camera_visualize}
        onChange={(camera_visualize) => onUpdate({ camera_visualize })}
      />
      <SensingNumberField
        label="camera.num"
        value={sensing.camera_num}
        onChange={(camera_num) => onUpdate({ camera_num })}
      />
      <FormControlLabel
        control={
          <Switch
            size="small"
            checked={sensing.lidar_visualize ?? false}
            onChange={(event) =>
              onUpdate({ lidar_visualize: event.target.checked })
            }
          />
        }
        label="lidar.visualize"
      />
      <SensingNumberField
        label="lidar.channels"
        value={sensing.lidar_channels}
        onChange={(lidar_channels) => onUpdate({ lidar_channels })}
      />
      <SensingNumberField
        label="lidar.range (m)"
        value={sensing.lidar_range}
        onChange={(lidar_range) => onUpdate({ lidar_range })}
      />
    </Stack>
  );
}
