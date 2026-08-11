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
});
