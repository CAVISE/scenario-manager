import { useEffect } from 'react';
import { useEditorStore } from '@/store';

function findStack(args: unknown[]): string | undefined {
  for (const arg of args) {
    if (arg instanceof Error && arg.stack) return arg.stack;
  }
  return undefined;
}

function stringifyConsoleArgs(args: unknown[]): string {
  return args
    .map((arg) => {
      if (arg instanceof Error) return arg.message;
      if (typeof arg === 'string') return arg;
      try {
        return JSON.stringify(arg);
      } catch {
        return String(arg);
      }
    })
    .join(' ');
}

export function useGlobalErrorLogger() {
  useEffect(() => {
    const originalConsoleError = console.error;
    console.error = (...args: unknown[]) => {
      originalConsoleError(...args);
      useEditorStore.getState().logError({
        message: stringifyConsoleArgs(args),
        stack: findStack(args),
        source: 'console',
      });
    };

    const onWindowError = (event: ErrorEvent) => {
      useEditorStore.getState().logError({
        message: event.message || 'Unknown error',
        stack: event.error?.stack,
        source: 'window.onerror',
        context: event.filename
          ? `${event.filename}:${event.lineno}:${event.colno}`
          : undefined,
      });
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      useEditorStore.getState().logError({
        message:
          reason instanceof Error
            ? reason.message
            : typeof reason === 'string'
              ? reason
              : 'Unhandled promise rejection',
        stack: reason instanceof Error ? reason.stack : undefined,
        source: 'unhandledrejection',
      });
    };

    window.addEventListener('error', onWindowError);
    window.addEventListener('unhandledrejection', onUnhandledRejection);

    return () => {
      console.error = originalConsoleError;
      window.removeEventListener('error', onWindowError);
      window.removeEventListener('unhandledrejection', onUnhandledRejection);
    };
  }, []);
}
