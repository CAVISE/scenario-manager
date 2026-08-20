import { ErrorLogSource } from '@/store/types/useEditorStoreTypes';

export interface ErrorLogModalProps {
  open: boolean;
  onClose: () => void;
}
export const SOURCE_LABEL: Record<ErrorLogSource, string> = {
  console: 'console.error',
  unhandledrejection: 'unhandled promise',
  'window.onerror': 'uncaught exception',
  'react-boundary': 'react error',
  manual: 'api/store',
};

export const SOURCE_COLOR: Record<
  ErrorLogSource,
  'default' | 'error' | 'warning' | 'info'
> = {
  console: 'default',
  unhandledrejection: 'warning',
  'window.onerror': 'error',
  'react-boundary': 'error',
  manual: 'info',
};
