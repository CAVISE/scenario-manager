import { describe, expect, it } from 'vitest';
import { parseNumberInputChange } from '../../utils/numberInputUtils';

describe('parseNumberInputChange', () => {
  it('uses valueAsNumber when the browser provides a numeric step value', () => {
    expect(
      parseNumberInputChange({
        value: '0.15',
        valueAsNumber: 0.15,
      } as HTMLInputElement),
    ).toBe(0.15);
  });

  it('returns undefined for empty input instead of forcing 0', () => {
    expect(
      parseNumberInputChange({
        value: '',
        valueAsNumber: NaN,
      } as HTMLInputElement),
    ).toBeUndefined();
  });
});
