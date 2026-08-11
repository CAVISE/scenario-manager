import { useCallback } from 'react';
import { useAppToast } from './AppToastProvider';
import type { NoticeLevel, UseNoticeWithToastOptions } from './toast.types';

export function useNoticeWithToast(
  setNotice: (message: string) => void,
  options: UseNoticeWithToastOptions = {},
) {
  const { defaultLevel = 'success' } = options;
  const toast = useAppToast();

  return useCallback(
    (message: string, level?: NoticeLevel) => {
      const finalLevel =
        level ?? (/error|failed/i.test(message) ? 'error' : defaultLevel);

      setNotice(message);

      switch (finalLevel) {
        case 'error':
          toast.error(message);
          break;
        case 'success':
          toast.success(message);
          break;
        case 'warning':
          toast.info(message);
          break;
        case 'info':
        default:
          toast.info(message);
          break;
      }
    },
    [setNotice, toast, defaultLevel],
  );
}
