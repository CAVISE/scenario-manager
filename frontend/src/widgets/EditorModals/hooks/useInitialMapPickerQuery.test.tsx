import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { useInitialMapPickerQuery } from './useInitialMapPickerQuery';

describe('useInitialMapPickerQuery', () => {
  afterEach(() => window.history.replaceState({}, '', '/'));

  it('consumes mapPicker while preserving unrelated query parameters', () => {
    window.history.replaceState({}, '', '/editor?mapPicker=1&run=run-42');
    renderHook(useInitialMapPickerQuery);

    expect(window.location.search).toBe('?run=run-42');
  });
});
