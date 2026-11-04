import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useEditorModalActions } from './useEditorModalActions';

const mocks = vi.hoisted(() => ({ getState: vi.fn() }));

vi.mock('@/store', () => ({
  useEditorStore: { getState: mocks.getState },
}));

const createOptions = () => ({
  setTelemetryOpen: vi.fn(),
  setSimulationOpen: vi.fn(),
  setMapPickerOpen: vi.fn(),
  selectMap: vi.fn().mockResolvedValue(undefined),
});

describe('useEditorModalActions', () => {
  afterEach(() => vi.clearAllMocks());

  it('loads a map selected in SimConfig without opening the map picker', () => {
    mocks.getState.mockReturnValue({ simConfig: { carla: { map: 'Town01' } } });
    const options = createOptions();
    renderHook(() => useEditorModalActions(options));

    act(() => window.editorModals?.selectMap('Town02'));

    expect(options.selectMap).toHaveBeenCalledWith('Town02');
    expect(options.setMapPickerOpen).not.toHaveBeenCalled();
  });

  it('opens the map picker only when explicitly requested from the toolbar', () => {
    const options = createOptions();
    renderHook(() => useEditorModalActions(options));

    act(() => window.editorModals?.openMapPicker());

    expect(options.setMapPickerOpen).toHaveBeenCalledWith(true);
  });
});
