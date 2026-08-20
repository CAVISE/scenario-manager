import { useCallback } from 'react';
import { useAppToast } from './AppToastProvider';

type ToastLevel = 'success' | 'error' | 'info' | 'warning';

interface UseNoticeWithToastOptions {
  defaultLevel?: ToastLevel;
}

export function useNoticeWithToast(
  setNotice: (message: string) => void,
  options: UseNoticeWithToastOptions = {}
) {
  const { defaultLevel = 'success' } = options;
  const toast = useAppToast();

  return useCallback(
    (message: string, level?: ToastLevel) => {
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
    [setNotice, toast, defaultLevel]
  );
}
