export type ToastLevel = 'success' | 'error' | 'info';

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
