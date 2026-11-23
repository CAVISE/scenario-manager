import { useState, type FormEvent, type ReactNode } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { HTTPError } from 'ky';
import { getCurrentUser, login, logout } from '@/api/auth';
import { queryClient } from '@/api/queryClient';
import { AuthContext } from '../model/AuthContext';
import './AuthGate.scss';

interface AuthGateProps {
  children: ReactNode;
}

function LoginForm() {
  const [loginValue, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const mutation = useMutation({
    mutationFn: () => login(loginValue, password),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] }),
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    mutation.mutate();
  }

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <span className="auth-card__eyebrow">CAVISE</span>
        <h1>Scenario Manager</h1>
        <p>Sign in to access the V2X scenario workspace.</p>
        <label>
          Login
          <input
            autoComplete="username"
            required
            type="text"
            minLength={3}
            maxLength={320}
            pattern="[A-Za-z0-9_]+"
            title="Use 3–320 Latin letters, digits or underscores."
            aria-describedby="login-hint"
            autoCapitalize="none"
            spellCheck={false}
            value={loginValue}
            onChange={(event) => setLogin(event.target.value)}
          />
        </label>
        <small id="login-hint">
          Use 3–320 Latin letters, digits or underscores.
        </small>
        <label htmlFor="login-password">Password</label>
        <span className="auth-card__password-field">
          <input
            id="login-password"
            autoComplete="current-password"
            required
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <button
            type="button"
            className="auth-card__password-toggle"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
            onClick={() => setShowPassword((visible) => !visible)}
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </span>
        {mutation.isError && (
          <p className="auth-card__error" role="alert">
            {getLoginErrorMessage(mutation.error)}
          </p>
        )}
        <button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </main>
  );
}

function getLoginErrorMessage(error: unknown): string {
  if (error instanceof HTTPError) {
    switch (error.response.status) {
      case 401:
        return 'Invalid login or password, or the account is disabled. Check your credentials or contact an administrator.';
      case 422:
        return 'Check your login and password. Login must contain 3–320 Latin letters, digits or underscores.';
      case 429:
        return 'Too many sign-in attempts. Please wait a minute and try again.';
      default:
        return 'Unable to sign in. Please try again later.';
    }
  }
  return 'Unable to connect. Check your network connection and try again.';
}

export function AuthGate({ children }: AuthGateProps) {
  const query = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: getCurrentUser,
    retry: false,
  });
  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: async () => {
      await queryClient.cancelQueries();
      // Do not leave the previous user visible while /me is being rechecked.
      queryClient.setQueryData(['auth', 'me'], null);
      queryClient.removeQueries({
        predicate: (cachedQuery) => cachedQuery.queryKey[0] !== 'auth',
      });
    },
  });

  if (query.isPending) {
    return <main className="auth-page">Checking access…</main>;
  }
  if (
    (query.isSuccess && !query.data) ||
    (query.error instanceof HTTPError && query.error.response.status === 401)
  ) {
    return <LoginForm />;
  }
  if (query.data) {
    return (
      <AuthContext.Provider
        key={`${query.data.login}:${query.data.role}:${query.data.authentication_enabled}`}
        value={{ user: query.data, logout: () => logoutMutation.mutateAsync() }}
      >
        {children}
      </AuthContext.Provider>
    );
  }
  return (
    <main className="auth-page">
      <section className="auth-card auth-card--status">
        <h1>Service unavailable</h1>
        <p>
          The workspace could not verify access. Check the backend connection.
        </p>
        <button type="button" onClick={() => query.refetch()}>
          Retry
        </button>
      </section>
    </main>
  );
}
