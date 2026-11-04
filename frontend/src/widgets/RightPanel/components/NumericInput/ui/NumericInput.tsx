import { useEffect, useRef, useState } from 'react';
import {
  Input,
  type InputProps,
  OutlinedInput,
  type OutlinedInputProps,
} from '@mui/material';
import type { NumericInputProps } from '../types/NumericInputTypes';
import { formatValue } from '../utils/numericInputUtils';

export default function NumericInput({
  value,
  onValueChange,
  precision = 3,
  variant = 'standard',
}: NumericInputProps) {
  const isFocused = useRef(false);
  const [inputValue, setInputValue] = useState(() =>
    formatValue(value, precision)
  );
  const [isInvalid, setIsInvalid] = useState(false);

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
      setIsInvalid(false);
      onValueChange(nextValue);
    } else {
      setIsInvalid(event.target.value.trim() !== '');
    }
  };

  const handleBlur: React.FocusEventHandler<HTMLInputElement> = (event) => {
    isFocused.current = false;

    const nextValue = event.target.valueAsNumber;
    if (Number.isFinite(nextValue)) {
      setIsInvalid(false);
      setInputValue(formatValue(nextValue, precision));
      if (nextValue !== value) {
        onValueChange(nextValue);
      }
      return;
    }

    setIsInvalid(false);
    setInputValue(formatValue(value, precision));
  };

  const sharedProps = {
    size: 'small',
    type: 'number',
    value: inputValue,
    onFocus: handleFocus,
    onChange: handleChange,
    onBlur: handleBlur,
    error: isInvalid,
    inputProps: {
      'aria-invalid': isInvalid || undefined,
    },
    slotProps: {
      input: {
        step: 1,
        onKeyDown: (event: React.KeyboardEvent) => event.stopPropagation(),
      },
    },
  } satisfies InputProps & OutlinedInputProps;

  const input =
    variant === 'outlined' ? (
      <OutlinedInput {...sharedProps} />
    ) : (
      <Input {...sharedProps} />
    );

  return (
    <>
      {input}
      {isInvalid && (
        <span className="numeric-input__error" role="alert">
          Enter a valid number.
        </span>
      )}
    </>
  );
}
