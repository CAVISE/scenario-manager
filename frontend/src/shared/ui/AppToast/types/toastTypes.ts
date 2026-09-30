import type { ReactNode } from 'react';

export type ToastLevel = 'success' | 'error' | 'info';
export type NoticeLevel = ToastLevel | 'warning';

export interface UseNoticeWithToastOptions {
  defaultLevel?: NoticeLevel;
}

export interface AppToastProviderProps {
  children: ReactNode;
}

export type ToastAction = {
  label: string;
  onClick: () => void;
  subscribeInvalidate?: (invalidate: () => void) => () => void;
};

export interface ToastApi {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  undo: (
    message: string,
    onAction: () => void,
    actionLabel?: string,
    subscribeInvalidate?: (invalidate: () => void) => () => void
  ) => void;
}
