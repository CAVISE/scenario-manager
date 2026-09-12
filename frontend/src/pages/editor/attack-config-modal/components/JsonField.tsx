import { useEffect, useRef, useState } from 'react';
import { TextField } from '@mui/material';
import type { JsonFieldProps } from '../AttackConfigModal.types';

export function JsonField({
  label,
  value,
  onChange,
  minRows = 4,
}: JsonFieldProps) {
  const valueRef = useRef(value == null ? '' : JSON.stringify(value, null, 2));
  const [raw, setRaw] = useState(() => valueRef.current);
  const [error, setError] = useState('');

  useEffect(() => {
    const nextAttack = value == null ? '' : JSON.stringify(value, null, 2);
    if (nextAttack !== valueRef.current) {
      valueRef.current = nextAttack;
      setRaw(nextAttack);
      setError('');
    }
  }, [value]);

  return (
    <TextField
      label={label}
      multiline
      minRows={minRows}
      fullWidth
      size="small"
      value={raw}
      error={Boolean(error)}
      helperText={error || 'JSON object'}
      onChange={(e) => {
        const nextAttack = e.target.value;
        setRaw(nextAttack);
        if (nextAttack.trim() === '') {
          setError('');
          onChange(undefined);
          return;
        }
        try {
          const parsed = JSON.parse(nextAttack) as unknown;
          if (
            typeof parsed !== 'object' ||
            parsed == null ||
            Array.isArray(parsed)
          ) {
            setError('Must be a JSON object');
            return;
          }
          setError('');
          valueRef.current = JSON.stringify(parsed, null, 2);
          onChange(parsed as Record<string, unknown>);
        } catch {
          setError('Invalid JSON');
        }
      }}
    />
  );
}
