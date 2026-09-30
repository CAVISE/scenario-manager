import { TextField } from '@mui/material';
import { numInputSlot } from '@/shared/utils/numberInputUtils';
import { validateNumber } from '../utils/opencdaFieldUtils';
import { parseNumberInputChange } from '@/shared/utils/numberInputUtils';
import type { NumFieldProps } from '../types/opencdaRareTypes';

export const NumField = ({
  label,
  value,
  onChange,
  step,
  min,
  max,
}: NumFieldProps) => (
  <TextField
    label={label}
    type="number"
    size="small"
    fullWidth
    inputProps={{
      ...numInputSlot.input,
      step: String(step ?? 1),
      min,
      max,
    }}
    value={value}
    onChange={(e) => {
      const parsed = parseNumberInputChange(e.target);
      const clamped = validateNumber(parsed || 0, min, max);
      onChange(clamped);
    }}
  />
);
