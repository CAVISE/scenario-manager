import { Stack, TextField, Typography } from '@mui/material';
import { numInputSlot } from '../../../../right-panel/right-panel.types';
import { validateNumber } from '../utils/opencdaFieldUtils';
import { parseNumberInputChange } from '../../../../../../shared/utils/numberInput';

type Props = {
  label: string;
  value: [number, number, number];
  onChange: (v: [number, number, number]) => void;
};

export const RgbTriple = ({ label, value, onChange }: Props) => (
  <Stack spacing={0.5}>
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
    <Stack direction="row" spacing={1}>
      {([0, 1, 2] as const).map((i) => (
        <TextField
          key={i}
          label={['R', 'G', 'B'][i]}
          type="number"
          size="small"
          inputProps={{
            ...numInputSlot.input,
            min: 0,
            max: 255,
          }}
          sx={{ width: 72 }}
          value={value[i]}
          onChange={(e) => {
            const parsed = parseNumberInputChange(e.target);
            const clamped = validateNumber(parsed || 0, 0, 255);
            const next = [...value] as [number, number, number];
            next[i] = clamped;
            onChange(next);
          }}
        />
      ))}
    </Stack>
  </Stack>
);
