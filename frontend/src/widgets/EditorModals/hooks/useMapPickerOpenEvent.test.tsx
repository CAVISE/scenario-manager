import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { openMapPicker } from '@/shared/lib/editorMapPickerEvent';
import { useMapPickerOpenEvent } from './useMapPickerOpenEvent';

describe('useMapPickerOpenEvent', () => {
  it('opens the picker when the toolbar dispatches its event', () => {
    const onOpen = vi.fn();
    renderHook(() => useMapPickerOpenEvent(onOpen));

    act(openMapPicker);

    expect(onOpen).toHaveBeenCalledOnce();
  });
});
