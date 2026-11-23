import { useState, type FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { HTTPError } from 'ky';
import { changePassword } from '@/api/users';
import { getApiErrorMessage } from '@/api/errors';
import { queryClient } from '@/api/queryClient';
import { useAuth } from '@/features/auth';
import { hasValidPasswordLength } from './passwordValidation';
import '../styles/UserManagement.scss';

export function ChangePasswordCard() {
  const { user } = useAuth();
  const [current, setCurrent] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const mutation = useMutation({
    mutationFn: async () => {
      try {
        await changePassword(current, password);
      } catch (err) {
        if (err instanceof HTTPError && err.response.status === 401) {
          void queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
        }
        throw new Error(
          await getApiErrorMessage(
            err,
            'Unable to change password. Please try again.'
          )
        );
      }
    },
    onSuccess: () => {
      setCurrent('');
      setPassword('');
      setConfirmation('');
      setSaved(true);
    },
    onError: (err) => setError(err.message),
  });
  function submit(event: FormEvent) {
    event.preventDefault();
    if (mutation.isPending) return;
    setSaved(false);
    if (!hasValidPasswordLength(current, 1)) {
      setError('Current password must contain 1–256 characters.');
      return;
    }
    if (!hasValidPasswordLength(password, 12)) {
      setError('New password must contain 12–256 characters.');
      return;
    }
    if (password !== confirmation) {
      setError('Passwords do not match.');
      return;
    }
    setError('');
    mutation.mutate();
  }
  return (
    <div className="workspace-settings-card">
      <h2>Account security</h2>
      {!user.authentication_enabled ? (
        <p className="workspace-settings-card__hint">
          Password changes are unavailable while authentication is disabled.
        </p>
      ) : (
        <>
          <p className="workspace-settings-card__hint">
            Change the password for {user.login}. Use 12–256 characters.
          </p>
          <form
            className="user-management-form user-management-password"
            onSubmit={submit}
            onChange={() => setSaved(false)}
          >
            <label>
              Current password
              <span className="user-management-password-field">
                <input
                  aria-label="Current password"
                  required
                  type={showCurrent ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={current}
                  onChange={(event) => setCurrent(event.target.value)}
                />
                <button
                  type="button"
                  className="user-management-password-toggle"
                  aria-label={
                    showCurrent
                      ? 'Hide current password'
                      : 'Show current password'
                  }
                  aria-pressed={showCurrent}
                  onClick={() => setShowCurrent((visible) => !visible)}
                >
                  {showCurrent ? 'Hide' : 'Show'}
                </button>
              </span>
            </label>
            <label>
              New password
              <span className="user-management-password-field">
                <input
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
            {error && (
              <p className="user-management-error" role="alert">
                {error}
              </p>
            )}
            {saved && <p role="status">Password changed.</p>}
            <button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving…' : 'Change password'}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
