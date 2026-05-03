import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useNoticeWithToast } from './useNoticeWithToast';
import { useAppToast } from './AppToastProvider';

vi.mock('./AppToastProvider', () => ({
  useAppToast: vi.fn(),
}));

describe('useNoticeWithToast', () => {
  const mockToast = {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  };

  const setNoticeMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useAppToast as any).mockReturnValue(mockToast);
  });

  it('should call toast.error if message contains "error" or "failed"', () => {
    const { result } = renderHook(() => useNoticeWithToast(setNoticeMock));

    result.current('Something failed');

    expect(setNoticeMock).toHaveBeenCalledWith('Something failed');
    expect(mockToast.error).toHaveBeenCalledWith('Something failed');
  });

  it('should call toast.info if mode is "info-default"', () => {
    const { result } = renderHook(() =>
      useNoticeWithToast(setNoticeMock, 'info-default'),
    );

    result.current('General info');

    expect(mockToast.info).toHaveBeenCalledWith('General info');
  });

  it('should call toast.success by default', () => {
    const { result } = renderHook(() => useNoticeWithToast(setNoticeMock));

    result.current('All good');

    expect(mockToast.success).toHaveBeenCalledWith('All good');
  });

  it('should be case-insensitive for errors', () => {
    const { result } = renderHook(() => useNoticeWithToast(setNoticeMock));

    result.current('ERROR OCCURRED');

    expect(mockToast.error).toHaveBeenCalled();
  });
});
