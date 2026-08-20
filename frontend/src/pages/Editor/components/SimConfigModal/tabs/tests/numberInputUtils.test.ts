import { describe, expect, it } from 'vitest';
import { parseNumberInputChange } from '../../utils/numberInputUtils';

describe('parseNumberInputChange', () => {
  it('uses valueAsNumber when the browser provides a numeric step value', () => {
    expect(
      parseNumberInputChange({
        value: '0.15',
        valueAsNumber: 0.15,
      } as HTMLInputElement)
    ).toBe(0.15);
  });

  it('returns undefined for empty input instead of forcing 0', () => {
    expect(
      parseNumberInputChange({
        value: '',
        valueAsNumber: NaN,
      } as HTMLInputElement)
    ).toBeUndefined();
  });

  it('returns undefined when valueAsNumber is not finite and value is empty string', () => {
    expect(
      parseNumberInputChange({
        value: '',
        valueAsNumber: NaN,
      } as HTMLInputElement)
    ).toBeUndefined();
  });

  it('parses string value to number when valueAsNumber is not available', () => {
    const input = {
      value: '42',
    } as HTMLInputElement;
    expect(parseNumberInputChange(input)).toBe(42);
  });

  it('returns undefined for non-numeric string when valueAsNumber is not available', () => {
    const input = {
      value: 'not-a-number',
    } as HTMLInputElement;
    expect(parseNumberInputChange(input)).toBeUndefined();
  });

  it('parses float string to number when valueAsNumber is not available', () => {
    const input = {
      value: '3.14',
    } as HTMLInputElement;
    expect(parseNumberInputChange(input)).toBe(3.14);
  });

  it('parses negative number string when valueAsNumber is not available', () => {
    const input = {
      value: '-10',
    } as HTMLInputElement;
    expect(parseNumberInputChange(input)).toBe(-10);
  });

  it('handles HTMLTextAreaElement with value property', () => {
    const textarea = {
      value: '123',
    } as HTMLTextAreaElement;
    expect(parseNumberInputChange(textarea)).toBe(123);
  });

  it('handles HTMLTextAreaElement with empty value', () => {
    const textarea = {
      value: '',
    } as HTMLTextAreaElement;
    expect(parseNumberInputChange(textarea)).toBeUndefined();
  });

  it('handles HTMLTextAreaElement with non-numeric value', () => {
    const textarea = {
      value: 'abc',
    } as HTMLTextAreaElement;
    expect(parseNumberInputChange(textarea)).toBeUndefined();
  });

  it('returns undefined when valueAsNumber is NaN but value is not empty and not a number', () => {
    const input = {
      value: 'abc',
      valueAsNumber: NaN,
    } as HTMLInputElement;
    expect(parseNumberInputChange(input)).toBeUndefined();
  });

  it('returns number from valueAsNumber even if value is empty', () => {
    const input = {
      value: '5',
      valueAsNumber: 5,
    } as HTMLInputElement;
    expect(parseNumberInputChange(input)).toBe(5);
  });

  it('returns undefined when value is whitespace only', () => {
    const input = {
      value: '   ',
    } as HTMLInputElement;
    expect(parseNumberInputChange(input)).toBe(0);
  });

  it('parses number with leading zeros when valueAsNumber is not available', () => {
    const input = {
      value: '007',
    } as HTMLInputElement;
    expect(parseNumberInputChange(input)).toBe(7);
  });

  it('parses scientific notation when valueAsNumber is not available', () => {
    const input = {
      value: '1e3',
    } as HTMLInputElement;
    expect(parseNumberInputChange(input)).toBe(1000);
  });

  it('returns undefined for Infinity when valueAsNumber is not available', () => {
    const input = {
      value: 'Infinity',
    } as HTMLInputElement;
    expect(parseNumberInputChange(input)).toBeUndefined();
  });

  it('returns undefined for -Infinity when valueAsNumber is not available', () => {
    const input = {
      value: '-Infinity',
    } as HTMLInputElement;
    expect(parseNumberInputChange(input)).toBeUndefined();
  });

  it('handles input with valueAsNumber but value is empty and valueAsNumber is 0', () => {
    const input = {
      value: '',
      valueAsNumber: 0,
    } as HTMLInputElement;
    expect(parseNumberInputChange(input)).toBeUndefined();
  });

  it('prefers valueAsNumber over parsing string value when both are available and valid', () => {
    const input = {
      value: '100',
      valueAsNumber: 200,
    } as HTMLInputElement;
    expect(parseNumberInputChange(input)).toBe(200);
  });
});
