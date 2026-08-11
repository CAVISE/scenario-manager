import { useEffect, useRef, useState } from 'react';
import {
  Input,
  type InputProps,
  OutlinedInput,
  type OutlinedInputProps,
} from '@mui/material';
import type { NumericInputProps } from './NumericInput.types';

const formatValue = (value: number, precision: number) =>
  Number.isFinite(value) ? value.toFixed(precision) : '';

export default function NumericInput({
  value,
  onValueChange,
  precision = 3,
  variant = 'standard',
}: NumericInputProps) {
  const isFocused = useRef(false);
  const [inputValue, setInputValue] = useState(() =>
    formatValue(value, precision),
  );

  useEffect(() => {
    if (!isFocused.current) {
      setInputValue(formatValue(value, precision));
    }
  }, [precision, value]);

  const handleFocus = () => {
    isFocused.current = true;
  };

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    setInputValue(event.target.value);

    const nextValue = event.target.valueAsNumber;
    if (Number.isFinite(nextValue)) {
      onValueChange(nextValue);
    }
  };

  const handleBlur: React.FocusEventHandler<HTMLInputElement> = (event) => {
    isFocused.current = false;

    const nextValue = event.target.valueAsNumber;
    if (Number.isFinite(nextValue)) {
      setInputValue(formatValue(nextValue, precision));
      if (nextValue !== value) {
        onValueChange(nextValue);
      }
      return;
    }

    setInputValue(formatValue(value, precision));
  };

  const sharedProps = {
    size: 'small',
    type: 'number',
    value: inputValue,
    onFocus: handleFocus,
    onChange: handleChange,
    onBlur: handleBlur,
    slotProps: {
      input: {
        step: 1,
        onKeyDown: (event: React.KeyboardEvent) => event.stopPropagation(),
      },
    },
  } satisfies InputProps & OutlinedInputProps;

  return variant === 'outlined' ? (
    <OutlinedInput {...sharedProps} />
  ) : (
    <Input {...sharedProps} />
  );
}
