import type { ErrorLogSource } from '@/store/types/useEditorStoreTypes';

export const COPY_FEEDBACK_DURATION = 2000;
export const EMPTY_STATE_MESSAGE =
  'No errors logged this session. Anything that reaches console.error, ' +
  'an uncaught exception, an unhandled promise rejection, or a failed ' +
  'API call will show up here.';

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
