import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Alert, Button, IconButton, Snackbar } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { ToastAction, ToastApi, ToastLevel } from '../types/toastTypes';

const noop = () => {};
const ToastContext = createContext<ToastApi>({
  success: noop,
  error: noop,
  info: noop,
  undo: noop,
});

export function AppToastProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [level, setLevel] = useState<ToastLevel>('info');
  const [action, setAction] = useState<ToastAction | null>(null);
  const actionRef = useRef<ToastAction | null>(null);

  const show = useCallback(
    (
      nextLevel: ToastLevel,
      nextMessage: string,
      nextAction: ToastAction | null = null
    ) => {
      if (!nextMessage.trim()) return;
      setLevel(nextLevel);
      setMessage(nextMessage);
      setAction(nextAction);
      actionRef.current = nextAction;
      setOpen(true);
    },
    []
  );

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  const handleActionClick = useCallback(() => {
    actionRef.current?.onClick();
    setOpen(false);
  }, []);

  const value = useMemo<ToastApi>(
    () => ({
      success: (msg) => show('success', msg),
      error: (msg) => show('error', msg),
      info: (msg) => show('info', msg),
      undo: (msg, onAction, actionLabel = 'Undo') =>
        show('info', msg, { label: actionLabel, onClick: onAction }),
    }),
    [show]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={action ? null : 3500}
        onClose={(_event, reason) => {
          if (action && reason === 'clickaway') return;
          handleClose();
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleClose}
          severity={level}
          variant="filled"
          sx={{ width: '100%' }}
          action={
            action ? (
              <>
                <Button
                  color="inherit"
                  size="small"
                  onClick={handleActionClick}
                >
                  {action.label}
                </Button>
                <IconButton
                  size="small"
                  color="inherit"
                  aria-label="Close"
                  title="Close"
                  onClick={handleClose}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </>
            ) : undefined
          }
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
