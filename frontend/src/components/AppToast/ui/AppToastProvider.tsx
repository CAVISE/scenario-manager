import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Alert, Snackbar } from '@mui/material';

type ToastLevel = 'success' | 'error' | 'info';

interface ToastApi {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const noop = () => {};
const ToastContext = createContext<ToastApi>({
  success: noop,
  error: noop,
  info: noop,
});

export function AppToastProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [level, setLevel] = useState<ToastLevel>('info');

  const show = useCallback((nextLevel: ToastLevel, nextMessage: string) => {
    if (!nextMessage.trim()) return;
    setLevel(nextLevel);
    setMessage(nextMessage);
    setOpen(true);
  }, []);

  const value = useMemo<ToastApi>(
    () => ({
      success: (msg) => show('success', msg),
      error: (msg) => show('error', msg),
      info: (msg) => show('info', msg),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={3500}
        onClose={() => setOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setOpen(false)}
          severity={level}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
}

export function useAppToast() {
  return useContext(ToastContext);
}
