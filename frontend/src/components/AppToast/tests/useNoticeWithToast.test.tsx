import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';
import { useNoticeWithToast } from '../ui/useNoticeWithToast';
import { useAppToast } from '../ui/AppToastProvider';

vi.mock('../ui/AppToastProvider', () => ({
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
    (useAppToast as Mock).mockReturnValue(mockToast);
  });

  it('should call toast.error if message contains "error" or "failed"', () => {
    const { result } = renderHook(() => useNoticeWithToast(setNoticeMock));

    result.current('Something failed');

    expect(setNoticeMock).toHaveBeenCalledWith('Something failed');
    expect(mockToast.error).toHaveBeenCalledWith('Something failed');
  });

  it('should call toast.info if mode is "info-default"', () => {
    const { result } = renderHook(() =>
      useNoticeWithToast(setNoticeMock, { defaultLevel: 'info' }),
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

  it('covers warning level: should call toast.info for warning level', () => {
    const { result } = renderHook(() => useNoticeWithToast(setNoticeMock));

    result.current('Warning message', 'warning');

    expect(setNoticeMock).toHaveBeenCalledWith('Warning message');
    expect(mockToast.info).toHaveBeenCalledWith('Warning message');
    expect(mockToast.error).not.toHaveBeenCalled();
    expect(mockToast.success).not.toHaveBeenCalled();
  });

  it('covers info level: should call toast.info for info level', () => {
    const { result } = renderHook(() => useNoticeWithToast(setNoticeMock));

    result.current('Info message', 'info');

    expect(setNoticeMock).toHaveBeenCalledWith('Info message');
    expect(mockToast.info).toHaveBeenCalledWith('Info message');
    expect(mockToast.error).not.toHaveBeenCalled();
    expect(mockToast.success).not.toHaveBeenCalled();
  });

  it('covers success level explicitly: should call toast.success for success level', () => {
    const { result } = renderHook(() => useNoticeWithToast(setNoticeMock));

    result.current('Success message', 'success');

    expect(setNoticeMock).toHaveBeenCalledWith('Success message');
    expect(mockToast.success).toHaveBeenCalledWith('Success message');
    expect(mockToast.error).not.toHaveBeenCalled();
    expect(mockToast.info).not.toHaveBeenCalled();
  });

  it('covers error level explicitly: should call toast.error for error level', () => {
    const { result } = renderHook(() => useNoticeWithToast(setNoticeMock));

    result.current('Error message', 'error');

    expect(setNoticeMock).toHaveBeenCalledWith('Error message');
    expect(mockToast.error).toHaveBeenCalledWith('Error message');
    expect(mockToast.success).not.toHaveBeenCalled();
    expect(mockToast.info).not.toHaveBeenCalled();
  });

  it('covers default level in switch: should call toast.info for unknown level', () => {
    const { result } = renderHook(() => useNoticeWithToast(setNoticeMock));

    // @ts-expect-error - testing invalid level
    result.current('Unknown level message', 'unknown');

    expect(setNoticeMock).toHaveBeenCalledWith('Unknown level message');
    expect(mockToast.info).toHaveBeenCalledWith('Unknown level message');
    expect(mockToast.error).not.toHaveBeenCalled();
    expect(mockToast.success).not.toHaveBeenCalled();
  });

  it('covers default behavior when message contains error but defaultLevel is info', () => {
    const { result } = renderHook(() =>
      useNoticeWithToast(setNoticeMock, { defaultLevel: 'info' }),
    );

    result.current('This is an error message');

    expect(mockToast.error).toHaveBeenCalledWith('This is an error message');
    expect(mockToast.info).not.toHaveBeenCalled();
  });

  it('covers default behavior when message contains failed but defaultLevel is info', () => {
    const { result } = renderHook(() =>
      useNoticeWithToast(setNoticeMock, { defaultLevel: 'info' }),
    );

    result.current('Operation failed');

    expect(mockToast.error).toHaveBeenCalledWith('Operation failed');
    expect(mockToast.info).not.toHaveBeenCalled();
  });

  it('covers default behavior when message does not contain error/failed and defaultLevel is info', () => {
    const { result } = renderHook(() =>
      useNoticeWithToast(setNoticeMock, { defaultLevel: 'info' }),
    );

    result.current('Regular info message');

    expect(mockToast.info).toHaveBeenCalledWith('Regular info message');
    expect(mockToast.error).not.toHaveBeenCalled();
    expect(mockToast.success).not.toHaveBeenCalled();
  });

  it('covers default behavior when message does not contain error/failed and no defaultLevel provided', () => {
    const { result } = renderHook(() => useNoticeWithToast(setNoticeMock));

    result.current('Regular success message');

    expect(mockToast.success).toHaveBeenCalledWith('Regular success message');
    expect(mockToast.error).not.toHaveBeenCalled();
    expect(mockToast.info).not.toHaveBeenCalled();
  });

  it('covers case when level is explicitly provided and overrides error detection', () => {
    const { result } = renderHook(() => useNoticeWithToast(setNoticeMock));

    result.current('This has error in it', 'success');

    expect(mockToast.success).toHaveBeenCalledWith('This has error in it');
    expect(mockToast.error).not.toHaveBeenCalled();
  });

  it('covers case when level is explicitly provided as info overrides error detection', () => {
    const { result } = renderHook(() => useNoticeWithToast(setNoticeMock));

    result.current('This has error in it', 'info');

    expect(mockToast.info).toHaveBeenCalledWith('This has error in it');
    expect(mockToast.error).not.toHaveBeenCalled();
  });

  it('covers case when level is explicitly provided as warning', () => {
    const { result } = renderHook(() => useNoticeWithToast(setNoticeMock));

    result.current('This has error in it', 'warning');

    expect(mockToast.info).toHaveBeenCalledWith('This has error in it');
    expect(mockToast.error).not.toHaveBeenCalled();
  });

  it('covers case-insensitive detection of ERROR in message', () => {
    const { result } = renderHook(() => useNoticeWithToast(setNoticeMock));

    result.current('This contains Error');

    expect(mockToast.error).toHaveBeenCalledWith('This contains Error');
  });

  it('covers case-insensitive detection of Failed in message', () => {
    const { result } = renderHook(() => useNoticeWithToast(setNoticeMock));

    result.current('This contains Failed');

    expect(mockToast.error).toHaveBeenCalledWith('This contains Failed');
  });
});
