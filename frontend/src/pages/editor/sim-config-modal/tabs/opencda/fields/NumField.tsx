import { TextField } from '@mui/material';
import { numInputSlot } from '../../../../right-panel/right-panel.types';
import { validateNumber } from '../utils/opencdaFieldUtils';
import { parseNumberInputChange } from '../../../../../../shared/utils/numberInput';

type Props = {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
};

export const NumField = ({ label, value, onChange, step, min, max }: Props) => (
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
