import { TextField } from '@mui/material';
import { numInputSlot } from '../../../../right-panel/right-panel.types';
import { validateNumber } from '../utils/opencdaFieldUtils';
import { parseNumberInputChange } from '../../../../../../shared/utils/numberInput';
import type { NumFieldProps } from '../opencda.types';

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
