import { FormControl, FormLabel, Grid, Input } from '@mui/material';
import { numInputSlot } from '../../../types/PanelTypes';
import { formLabelStyles } from '../types/CarPropertiesTypes';
import { parseRgbValueFromEvent } from '../utils/carOpenCDAHelpers';

export function RgbEditor({
  color,
  onChange,
}: {
  color: [number, number, number];
  onChange: (next: [number, number, number]) => void;
}) {
  return (
    <Grid container spacing={1}>
      {(['R', 'G', 'B'] as const).map((label, idx) => (
        <Grid xs={4} key={label}>
          <FormControl>
            <FormLabel sx={formLabelStyles}>{label}</FormLabel>
            <Input
              size="small"
              type="number"
              slotProps={numInputSlot}
              value={color[idx]}
              onChange={(e) => {
                const parsed = parseRgbValueFromEvent(e);
                if (parsed === undefined) return;
                const next = [...color] as [number, number, number];
                next[idx] = parsed;
                onChange(next);
              }}
            />
          </FormControl>
        </Grid>
      ))}
    </Grid>
  );
}
