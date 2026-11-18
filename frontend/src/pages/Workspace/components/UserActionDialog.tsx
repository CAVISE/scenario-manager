import { useState, type FormEvent } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import { useMutation } from '@tanstack/react-query';
import { HTTPError } from 'ky';
import {
  createUser,
  resetUserPassword,
  setUserActive,
  type ManagedUser,
} from '@/api/users';
import type { UserRole } from '@/api/types/authTypes';
import { getApiErrorMessage } from '@/api/errors';
import { queryClient } from '@/api/queryClient';
import { hasValidPasswordLength } from './passwordValidation';

export type UserAction =
  { kind: 'create' } | { kind: 'reset' | 'status'; user: ManagedUser };

export function UserActionDialog({
  action,
  onClose,
  onSuccess,
}: {
  action: UserAction;
  onClose: () => void;
  onSuccess: (message: string) => void;
}) {
  const [login, setLogin] = useState('');
  const [role, setRole] = useState<UserRole>('viewer');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const disabling = action.kind === 'status' && action.user.is_active;
  const title =
    action.kind === 'create'
      ? 'Create user'
      : action.kind === 'reset'
        ? `Reset password for ${action.user.login}`
        : `${action.user.is_active ? 'Disable' : 'Enable'} ${action.user.login}?`;
  const mutation = useMutation({
    mutationFn: async () => {
      try {
        if (action.kind === 'create') await createUser(login, password, role);
        else if (action.kind === 'reset')
          await resetUserPassword(action.user.id, password);
        else await setUserActive(action.user.id, !action.user.is_active);
      } catch (err) {
        if (err instanceof HTTPError && err.response.status === 401) {
          void queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
        }
        throw new Error(
          await getApiErrorMessage(
            err,
            'Unable to save changes. Please try again.'
          )
        );
      }
    },
    onSuccess: () =>
      onSuccess(
        action.kind === 'create'
          ? 'User created.'
          : action.kind === 'reset'
            ? `Password reset for ${action.user.login}.`
            : `${action.user.login} ${action.user.is_active ? 'disabled' : 'enabled'}.`
      ),
    onError: (err) => setError(err.message),
  });
  function submit(event: FormEvent) {
    event.preventDefault();
    if (mutation.isPending) return;
    if (action.kind !== 'status' && !hasValidPasswordLength(password, 12)) {
      setError('New password must contain 12–256 characters.');
      return;
    }
    if (action.kind !== 'status' && password !== confirmation) {
      setError('Passwords do not match.');
      return;
    }
    setError('');
    mutation.mutate();
  }
  return (
    <Dialog
      open
      onClose={() => {
        if (!mutation.isPending) onClose();
      }}
      fullWidth
      maxWidth="sm"
      aria-labelledby="user-action-title"
    >
      <form className="user-management-form" onSubmit={submit}>
        <DialogTitle id="user-action-title">{title}</DialogTitle>
        <DialogContent>
          {action.kind === 'status' ? (
            <p>
              {action.user.is_active
                ? 'This user will immediately lose access. Their scenarios and results will be kept.'
                : 'This user will be able to sign in again with their existing password.'}
            </p>
          ) : (
            <>
              {action.kind === 'create' && (
                <>
                  <label>
                    Login
                    <input
                      autoFocus
                      required
                      minLength={3}
                      maxLength={320}
                      pattern="[A-Za-z0-9_]+"
                      title="At least 3 letters, digits or underscores"
                      autoComplete="off"
                      value={login}
                      onChange={(event) => setLogin(event.target.value)}
                    />
                  </label>
                  <label>
                    Role
                    <select
                      value={role}
                      onChange={(event) =>
                        setRole(event.target.value as UserRole)
                      }
                    >
                      <option value="viewer">Viewer</option>
                      <option value="operator">Operator</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </label>
                </>
              )}
              <p className="user-management-hint">
                Use 12–256 characters. Share the password securely; it will not
                be displayed after saving.
              </p>
              <label>
                New password
                <input
                  autoFocus={action.kind === 'reset'}
                  required
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </label>
              <label>
                Confirm new password
                <input
                  required
                  type="password"
                  autoComplete="new-password"
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                />
              </label>
            </>
          )}
          {error && (
            <p className="user-management-error" role="alert">
              {error}
            </p>
          )}
        </DialogContent>
        <DialogActions
          disableSpacing
          className="user-management-dialog-actions"
        >
          <Button
            className="user-management-dialog-action"
            type="button"
            variant="text"
            color="inherit"
            disabled={mutation.isPending}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            className={`user-management-dialog-action${disabling ? ' user-management-dialog-action--danger' : ''}`}
            type="submit"
            variant="contained"
            color={disabling ? 'error' : 'primary'}
            disableElevation
            loading={mutation.isPending}
          >
            {mutation.isPending
              ? 'Saving…'
              : action.kind === 'create'
                ? 'Create user'
                : action.kind === 'reset'
                  ? 'Reset password'
                  : action.user.is_active
                    ? 'Disable user'
                    : 'Enable user'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
