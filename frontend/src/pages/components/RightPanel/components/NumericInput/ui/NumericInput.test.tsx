import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import NumericInput from './NumericInput';

function NumericInputHarness() {
  const [value, setValue] = useState(1);

  return <NumericInput value={value} onValueChange={setValue} />;
}

describe('NumericInput', () => {
  it('can step up and then immediately step down while focused', () => {
    render(<NumericInputHarness />);
    const input = screen.getByRole('spinbutton') as HTMLInputElement;

    fireEvent.focus(input);
    input.stepUp();
    fireEvent.change(input);
    expect(input).toHaveValue(2);

    input.stepDown();
    fireEvent.change(input);
    expect(input).toHaveValue(1);
  });

  it('does not publish an invalid value and restores the last number on blur', () => {
    const onValueChange = vi.fn();
    render(<NumericInput value={12.5} onValueChange={onValueChange} />);
    const input = screen.getByRole('spinbutton');

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '' } });
    expect(onValueChange).not.toHaveBeenCalled();

    fireEvent.blur(input);
    expect(input).toHaveValue(12.5);
  });

  it('covers handleBlur: updates value when valid number is entered', () => {
    const onValueChange = vi.fn();
    render(<NumericInput value={5} onValueChange={onValueChange} />);
    const input = screen.getByRole('spinbutton');

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '10' } });
    fireEvent.blur(input);

    expect(onValueChange).toHaveBeenCalledTimes(2);
    expect(onValueChange).toHaveBeenLastCalledWith(10);
    expect(input).toHaveValue(10);
  });

  it('covers handleBlur: does not call onValueChange if value did not change', () => {
    const onValueChange = vi.fn();
    render(<NumericInput value={5} onValueChange={onValueChange} />);
    const input = screen.getByRole('spinbutton');

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '5' } });
    fireEvent.blur(input);

    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith(5);
    expect(input).toHaveValue(5);
  });

  it('covers handleBlur: restores previous value when invalid number is entered', () => {
    const onValueChange = vi.fn();
    render(<NumericInput value={7.5} onValueChange={onValueChange} />);
    const input = screen.getByRole('spinbutton');

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'abc' } });
    fireEvent.blur(input);

    expect(onValueChange).not.toHaveBeenCalled();
    expect(input).toHaveValue(7.5);
  });

  it('covers handleBlur: restores previous value when empty string is entered', () => {
    const onValueChange = vi.fn();
    render(<NumericInput value={3} onValueChange={onValueChange} />);
    const input = screen.getByRole('spinbutton');

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.blur(input);

    expect(onValueChange).not.toHaveBeenCalled();
    expect(input).toHaveValue(3);
  });

  it('covers handleChange: updates input value on change', () => {
    const onValueChange = vi.fn();
    render(<NumericInput value={1} onValueChange={onValueChange} />);
    const input = screen.getByRole('spinbutton');

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '42' } });

    expect(input).toHaveValue(42);
    expect(onValueChange).toHaveBeenCalledWith(42);
  });

  it('covers handleChange: does not call onValueChange for invalid number', () => {
    const onValueChange = vi.fn();
    render(<NumericInput value={1} onValueChange={onValueChange} />);
    const input = screen.getByRole('spinbutton');

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'not-a-number' } });

    expect(input).toHaveValue(null);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('covers variant: renders OutlinedInput when variant is outlined', () => {
    const onValueChange = vi.fn();
    render(
      <NumericInput
        value={1}
        onValueChange={onValueChange}
        variant="outlined"
      />
    );
    const input = screen.getByRole('spinbutton');
    expect(input).toBeInTheDocument();
    expect(input.closest('.MuiOutlinedInput-root')).toBeInTheDocument();
  });

  it('covers variant: renders Input when variant is standard', () => {
    const onValueChange = vi.fn();
    render(
      <NumericInput
        value={1}
        onValueChange={onValueChange}
        variant="standard"
      />
    );
    const input = screen.getByRole('spinbutton');
    expect(input).toBeInTheDocument();
    expect(input.closest('.MuiInput-root')).toBeInTheDocument();
  });

  it('covers precision: formats value with specified precision', () => {
    const onValueChange = vi.fn();
    render(
      <NumericInput
        value={1.23456}
        onValueChange={onValueChange}
        precision={2}
      />
    );
    const input = screen.getByRole('spinbutton');
    expect(input).toHaveValue(1.23);
  });

  it('covers precision: formats value with default precision of 3', () => {
    const onValueChange = vi.fn();
    render(<NumericInput value={1.23456} onValueChange={onValueChange} />);
    const input = screen.getByRole('spinbutton');
    expect(input).toHaveValue(1.235);
  });

  it('covers onKeyDown: stops event propagation', () => {
    const onValueChange = vi.fn();
    render(<NumericInput value={1} onValueChange={onValueChange} />);
    const input = screen.getByRole('spinbutton');

    const keyDownEvent = new KeyboardEvent('keydown', {
      key: 'Enter',
      bubbles: true,
      cancelable: true,
    });
    const stopPropagationSpy = vi.spyOn(keyDownEvent, 'stopPropagation');

    fireEvent.focus(input);
    input.dispatchEvent(keyDownEvent);

    expect(stopPropagationSpy).toHaveBeenCalled();
  });

  it('covers useEffect: updates input value when value prop changes and not focused', () => {
    const onValueChange = vi.fn();
    const { rerender } = render(
      <NumericInput value={1} onValueChange={onValueChange} />
    );
    const input = screen.getByRole('spinbutton');
    expect(input).toHaveValue(1);

    rerender(<NumericInput value={5} onValueChange={onValueChange} />);
    expect(input).toHaveValue(5);
  });

  it('covers useEffect: does not update input value when focused', () => {
    const onValueChange = vi.fn();
    const { rerender } = render(
      <NumericInput value={1} onValueChange={onValueChange} />
    );
    const input = screen.getByRole('spinbutton');

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '10' } });
    expect(input).toHaveValue(10);

    rerender(<NumericInput value={20} onValueChange={onValueChange} />);
    expect(input).toHaveValue(10);
  });

  it('covers formatValue: handles non-finite value', () => {
    const onValueChange = vi.fn();
    render(<NumericInput value={NaN} onValueChange={onValueChange} />);
    const input = screen.getByRole('spinbutton');
    expect(input).toHaveValue(null);
  });

  it('covers formatValue: handles Infinity value', () => {
    const onValueChange = vi.fn();
    render(<NumericInput value={Infinity} onValueChange={onValueChange} />);
    const input = screen.getByRole('spinbutton');
    expect(input).toHaveValue(null);
  });

  it('covers stepUp and stepDown with decimal precision', () => {
    const onValueChange = vi.fn();
    render(
      <NumericInput value={1.5} onValueChange={onValueChange} precision={2} />
    );
    const input = screen.getByRole('spinbutton') as HTMLInputElement;

    fireEvent.focus(input);
    input.stepUp();
    fireEvent.change(input);
    expect(input).toHaveValue(2.5);
  });

  it('covers handleBlur: does not call onValueChange when value unchanged after blur', () => {
    const onValueChange = vi.fn();
    const { rerender } = render(
      <NumericInput value={10} onValueChange={onValueChange} />
    );
    const input = screen.getByRole('spinbutton');

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '15' } });
    expect(onValueChange).toHaveBeenCalledWith(15);

    rerender(<NumericInput value={15} onValueChange={onValueChange} />);

    onValueChange.mockClear();

    fireEvent.blur(input);
    expect(onValueChange).not.toHaveBeenCalled();
    expect(input).toHaveValue(15);
  });
});
