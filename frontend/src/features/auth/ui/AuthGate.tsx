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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const mutation = useMutation({
    mutationFn: () => login(email, password),
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
          Email
          <input
            autoComplete="email"
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label>
          Password
          <input
            autoComplete="current-password"
            required
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
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
    return error.response.status === 401
      ? 'Invalid email or password.'
      : 'Unable to sign in. Please try again.';
  }
  return 'Unable to sign in. Please try again.';
}

export function AuthGate({ children }: AuthGateProps) {
  const query = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: getCurrentUser,
    retry: false,
  });
  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] }),
  });

  if (query.isPending) {
    return <main className="auth-page">Checking access…</main>;
  }
  if (query.data) {
    return (
      <AuthContext.Provider
        value={{ user: query.data, logout: () => logoutMutation.mutateAsync() }}
      >
        {children}
      </AuthContext.Provider>
    );
  }
  if (query.error instanceof HTTPError && query.error.response.status === 401) {
    return <LoginForm />;
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
