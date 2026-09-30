import { FormControl, FormLabel, Grid, Input } from '@mui/material';
import type { RgbEditorProps } from '../types/CarPropertiesTypes';
import { parseRgbValueFromEvent } from '../utils/carOpenCDAHelpers';
import { numInputSlot } from '@/shared/utils/numberInputUtils';
import '../styles/CarPropertiesSections.scss';

export function RgbEditor({ color, onChange }: RgbEditorProps) {
  return (
    <Grid container spacing={1}>
      {(['R', 'G', 'B'] as const).map((label, idx) => (
        <Grid xs={4} key={label}>
          <FormControl>
            <FormLabel className="car-properties-section__label">
              {label}
            </FormLabel>
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
