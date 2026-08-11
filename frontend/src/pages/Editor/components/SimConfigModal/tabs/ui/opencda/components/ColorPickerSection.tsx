import {
  Box,
  Button,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
} from '@mui/material';
import {
  numInputSlot,
  clamp,
  rgbToHex,
  hexToRgb,
  parseNumberFromEvent,
} from '../utils/opencdaFieldUtils';

interface ColorPickerSectionProps {
  color: [number, number, number];
  hasColor: boolean;
  onColorToggle: (enabled: boolean) => void;
  onColorChange: (newColor: [number, number, number]) => void;
}

export const ColorPickerSection = ({
  color,
  hasColor,
  onColorToggle,
  onColorChange,
}: ColorPickerSectionProps) => {
  const handleColorChange = (index: 0 | 1 | 2, value: number) => {
    const clamped = clamp(value, 0, 255);
    const newColor = [...color] as [number, number, number];
    newColor[index] = clamped;
    onColorChange(newColor);
  };

  const DEFAULT_COLOR: [number, number, number] = [122, 156, 111];

  return (
    <Stack spacing={1}>
      <FormControlLabel
        control={
          <Switch
            checked={hasColor}
            onChange={(e) => onColorToggle(e.target.checked)}
          />
        }
        label="vehicle_base.behavior.color (RGB)"
      />

      {hasColor && (
        <Stack spacing={1.5}>
          <Stack direction="row" spacing={1} alignItems="center">
            {([0, 1, 2] as const).map((idx) => (
              <TextField
                key={idx}
                label={['R', 'G', 'B'][idx]}
                type="number"
                size="small"
                inputProps={{
                  ...numInputSlot.input,
                  min: 0,
                  max: 255,
                }}
                value={color[idx]}
                onChange={(e) => {
                  const val = parseNumberFromEvent(e, 0, 255);
                  if (val !== undefined) handleColorChange(idx, val);
                }}
                sx={{ width: 72 }}
              />
            ))}

            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 1,
                border: '1px solid #ddd',
                backgroundColor: `rgb(${color.join(',')})`,
                ml: 1,
              }}
            />

            <TextField
              label="HEX"
              size="small"
              value={rgbToHex(color[0], color[1], color[2])}
              onChange={(e) => {
                const rgb = hexToRgb(e.target.value);
                if (rgb) {
                  onColorChange(rgb);
                }
              }}
              sx={{ width: 100, ml: 1 }}
            />

            <Button
              size="small"
              variant="outlined"
              onClick={() => onColorChange(DEFAULT_COLOR)}
            >
              Reset
            </Button>
          </Stack>
        </Stack>
      )}
    </Stack>
  );
};
