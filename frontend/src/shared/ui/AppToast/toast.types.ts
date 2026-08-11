export type ToastLevel = 'success' | 'error' | 'info';

export type NoticeLevel = ToastLevel | 'warning';

export interface UseNoticeWithToastOptions {
  defaultLevel?: NoticeLevel;
}

export type ToastAction = {
  label: string;
  onClick: () => void;
};

export interface ToastApi {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  undo: (message: string, onAction: () => void, actionLabel?: string) => void;
}
