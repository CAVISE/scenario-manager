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
  updateUser,
  type ManagedUser,
} from '@/api/users';
import type { UserRole } from '@/api/types/authTypes';
import { getApiErrorMessage } from '@/api/errors';
import { queryClient } from '@/api/queryClient';
import { hasValidPasswordLength } from './passwordValidation';

export type UserAction =
  | { kind: 'create' }
  | { kind: 'edit'; user: ManagedUser; isSelf: boolean; keepAdmin: boolean }
  | { kind: 'reset' | 'status'; user: ManagedUser };

export function UserActionDialog({
  action,
  onClose,
  onSuccess,
}: {
  action: UserAction;
  onClose: () => void;
  onSuccess: (message: string, sessionChanged?: boolean) => void;
}) {
  const [login, setLogin] = useState(
    action.kind === 'edit' ? action.user.login : ''
  );
  const [role, setRole] = useState<UserRole>(
    action.kind === 'edit' ? action.user.role : 'viewer'
  );
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState('');
  const disabling = action.kind === 'status' && action.user.is_active;
  const title =
    action.kind === 'create'
      ? 'Create user'
      : action.kind === 'edit'
        ? `Edit ${action.user.login}`
        : action.kind === 'reset'
          ? `Reset password for ${action.user.login}`
          : `${action.user.is_active ? 'Disable' : 'Enable'} ${action.user.login}?`;
  const mutation = useMutation({
    mutationFn: async () => {
      try {
        if (action.kind === 'create') await createUser(login, password, role);
        else if (action.kind === 'edit')
          await updateUser(action.user.id, login, role);
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
          : action.kind === 'edit'
            ? 'User updated.'
            : action.kind === 'reset'
              ? `Password reset for ${action.user.login}.`
              : `${action.user.login} ${action.user.is_active ? 'disabled' : 'enabled'}.`,
        action.kind === 'edit' && action.isSelf
      ),
    onError: (err) => setError(err.message),
  });
  function submit(event: FormEvent) {
    event.preventDefault();
    if (mutation.isPending) return;
    if (
      (action.kind === 'create' || action.kind === 'reset') &&
      !hasValidPasswordLength(password, 12)
    ) {
      setError('New password must contain 12–256 characters.');
      return;
    }
    if (
      (action.kind === 'create' || action.kind === 'reset') &&
      password !== confirmation
    ) {
      setError('Passwords do not match.');
      return;
    }
    setError('');
    mutation.mutate();
  }

  const passwordInputs = (
    <>
      <p className="user-management-hint">
        Use 12–256 characters. Share the password securely; it will not be
        displayed after saving.
      </p>
      <label>
        New password
        <span className="user-management-password-field">
          <input
            autoFocus={action.kind === 'reset'}
            aria-label="New password"
            required
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <button
            type="button"
            className="user-management-password-toggle"
            aria-label={
              showPassword ? 'Hide new password' : 'Show new password'
            }
            aria-pressed={showPassword}
            onClick={() => setShowPassword((visible) => !visible)}
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </span>
      </label>
      <label>
        Confirm new password
        <span className="user-management-password-field">
          <input
            aria-label="Confirm new password"
            required
            type={showConfirmation ? 'text' : 'password'}
            autoComplete="new-password"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
          />
          <button
            type="button"
            className="user-management-password-toggle"
            aria-label={
              showConfirmation
                ? 'Hide password confirmation'
                : 'Show password confirmation'
            }
            aria-pressed={showConfirmation}
            onClick={() => setShowConfirmation((visible) => !visible)}
          >
            {showConfirmation ? 'Hide' : 'Show'}
          </button>
        </span>
      </label>
    </>
  );

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
          ) : action.kind === 'edit' ? (
            <>
              <label>
                Login
                <input
                  autoFocus
                  required
                  minLength={3}
                  maxLength={320}
                  pattern="[A-Za-z0-9_]+"
                  title="Use 3–320 Latin letters, digits or underscores."
                  autoCapitalize="none"
                  spellCheck={false}
                  value={login}
                  onChange={(event) => setLogin(event.target.value)}
                />
              </label>
              <label>
                Role
                <select
                  value={role}
                  disabled={action.keepAdmin}
                  title={
                    action.keepAdmin
                      ? 'The last active administrator must remain an administrator.'
                      : undefined
                  }
                  onChange={(event) => setRole(event.target.value as UserRole)}
                >
                  <option value="viewer">Viewer</option>
                  <option value="operator">Operator</option>
                  <option value="admin">Administrator</option>
                </select>
              </label>
              {action.keepAdmin && (
                <p className="user-management-hint">
                  The last active administrator must remain an administrator.
                </p>
              )}
            </>
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
              {passwordInputs}
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
                : action.kind === 'edit'
                  ? 'Save changes'
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
