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
              <input
                required
                type="password"
                autoComplete="current-password"
                value={current}
                onChange={(event) => setCurrent(event.target.value)}
              />
            </label>
            <label>
              New password
              <input
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
