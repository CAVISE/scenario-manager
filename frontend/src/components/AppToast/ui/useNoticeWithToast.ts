import { useCallback } from 'react';
import { useAppToast } from './AppToastProvider';

export function useNoticeWithToast(
  setNotice: (message: string) => void,
  mode: 'success-default' | 'info-default' = 'success-default',
) {
  const toast = useAppToast();

  return useCallback(
    (message: string) => {
      setNotice(message);
      const msg = message.toLowerCase();
      if (msg.includes('failed') || msg.includes('error')) {
        toast.error(message);
        return;
      }
      if (mode === 'info-default') {
        toast.info(message);
        return;
      }
      toast.success(message);
    },
    [setNotice, toast, mode],
  );
}
