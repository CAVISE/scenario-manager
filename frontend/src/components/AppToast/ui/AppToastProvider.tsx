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
  const invalidateUnsubRef = useRef<(() => void) | null>(null);

  const clearInvalidateSub = useCallback(() => {
    invalidateUnsubRef.current?.();
    invalidateUnsubRef.current = null;
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    clearInvalidateSub();
  }, [clearInvalidateSub]);

  const show = useCallback(
    (
      nextLevel: ToastLevel,
      nextMessage: string,
      nextAction: ToastAction | null = null
    ) => {
      if (!nextMessage.trim()) return;
      clearInvalidateSub();
      setLevel(nextLevel);
      setMessage(nextMessage);
      setAction(nextAction);
      actionRef.current = nextAction;
      setOpen(true);

      if (nextAction?.subscribeInvalidate) {
        invalidateUnsubRef.current = nextAction.subscribeInvalidate(() => {
          setOpen(false);
          clearInvalidateSub();
        });
      }
    },
    [clearInvalidateSub]
  );

  const handleActionClick = useCallback(() => {
    actionRef.current?.onClick();
    setOpen(false);
    clearInvalidateSub();
  }, [clearInvalidateSub]);

  const value = useMemo<ToastApi>(
    () => ({
      success: (msg) => show('success', msg),
      error: (msg) => show('error', msg),
      info: (msg) => show('info', msg),
      undo: (msg, onAction, actionLabel = 'Undo', subscribeInvalidate) =>
        show('info', msg, {
          label: actionLabel,
          onClick: onAction,
          subscribeInvalidate,
        }),
    }),
    [show]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={action ? 8000 : 3500}
        onClose={(_event, reason) => {
          if (action && reason === 'clickaway') return;
          handleClose();
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
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
