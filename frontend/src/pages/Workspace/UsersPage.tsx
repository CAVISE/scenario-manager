import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { HTTPError } from 'ky';
import { listUsers } from '@/api/users';
import { getApiErrorMessage } from '@/api/errors';
import { queryClient } from '@/api/queryClient';
import { useAuth } from '@/features/auth';
import {
  UserActionDialog,
  type UserAction,
} from './components/UserActionDialog';
import './styles/UserManagement.scss';

export default function UsersPage() {
  const { user } = useAuth();
  const [action, setAction] = useState<UserAction | null>(null);
  const [message, setMessage] = useState('');
  const allowed = user.role === 'admin';
  useEffect(() => {
    if (!message) return;
    const timeout = window.setTimeout(() => setMessage(''), 5000);
    return () => window.clearTimeout(timeout);
  }, [message]);
  const users = useQuery({
    queryKey: ['users', user.login],
    enabled: allowed,
    gcTime: 0,
    queryFn: async () => {
      try {
        return await listUsers();
      } catch (err) {
        if (err instanceof HTTPError && err.response.status === 401) {
          void queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
        }
        throw new Error(
          await getApiErrorMessage(
            err,
            'Unable to load users. Please try again.'
          )
        );
      }
    },
    retry: false,
  });
  if (!allowed)
    return (
      <section>
        <h1>Users</h1>
        <p role="alert">Only administrators can manage users.</p>
      </section>
    );
  const activeAdmins =
    users.data?.filter((entry) => entry.is_admin && entry.is_active).length ??
    0;
  const roleLabel = (role: string) =>
    role === 'admin'
      ? 'Administrator'
      : role === 'operator'
        ? 'Operator'
        : 'Viewer';
  return (
    <section>
      <div className="workspace-page-heading">
        <div>
          <span className="workspace-kicker">ACCESS CONTROL</span>
          <h1>Users</h1>
          <p>Manage workspace access and account security.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setMessage('');
            setAction({ kind: 'create' });
          }}
        >
          Create user
        </button>
      </div>
      {!user.authentication_enabled && (
        <p className="user-management-notice">
          Authentication is disabled. Account changes will apply when
          authentication is enabled.
        </p>
      )}
      {message && (
        <div className="user-management-notice-wrap">
          <p className="user-management-notice" role="status">
            {message}
          </p>
          <button
            type="button"
            className="user-management-notice-close"
            onClick={() => setMessage('')}
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      )}
      <div className="workspace-settings-card user-management-card">
        <div className="workspace-section-heading">
          <h2>Workspace accounts</h2>
          <button
            type="button"
            className="workspace-secondary"
            disabled={users.isFetching}
            onClick={() => void users.refetch()}
          >
            {users.isFetching ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
        {users.isPending && <p role="status">Loading users…</p>}
        {users.isError && (
          <p className="user-management-error" role="alert">
            {users.error.message} Use Refresh to try again.
          </p>
        )}
        {users.data && !users.isError && (
          <div
            className="user-management-table-scroll"
            role="region"
            aria-label="Workspace accounts"
            tabIndex={0}
          >
            <table className="user-management-table">
              <caption>
                {users.data.length} workspace accounts. Update access,
                passwords, and availability from one place.
              </caption>
              <thead>
                <tr>
                  <th scope="col">Login</th>
                  <th scope="col">Access</th>
                  <th scope="col">Status</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.data.map((entry) => {
                  const self =
                    user.authentication_enabled && entry.login === user.login;
                  const lastAdmin =
                    entry.is_admin && entry.is_active && activeAdmins <= 1;
                  return (
                    <tr key={entry.id}>
                      <th scope="row">
                        {entry.login}
                        {self && <small> (you)</small>}
                      </th>
                      <td>{roleLabel(entry.role)}</td>
                      <td>
                        <span
                          className={`user-management-status${entry.is_active ? '' : ' user-management-status--disabled'}`}
                        >
                          {entry.is_active ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td>
                        <div className="user-management-actions">
                          <button
                            type="button"
                            className="workspace-secondary"
                            onClick={() => {
                              setMessage('');
                              setAction({
                                kind: 'edit',
                                user: entry,
                                isSelf: self,
                                keepAdmin: lastAdmin,
                              });
                            }}
                            aria-label={`Edit ${entry.login}`}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="workspace-secondary"
                            onClick={() => {
                              setMessage('');
                              setAction({ kind: 'reset', user: entry });
                            }}
                            aria-label={`Reset password for ${entry.login}`}
                          >
                            Reset password
                          </button>
                          <button
                            type="button"
                            className="workspace-secondary"
                            disabled={self || lastAdmin}
                            title={
                              self
                                ? 'You cannot disable your own account here.'
                                : lastAdmin
                                  ? 'The last active administrator cannot be disabled.'
                                  : undefined
                            }
                            onClick={() => {
                              setMessage('');
                              setAction({ kind: 'status', user: entry });
                            }}
                            aria-label={`${entry.is_active ? 'Disable' : 'Enable'} ${entry.login}`}
                          >
                            {entry.is_active ? 'Disable' : 'Enable'}
                          </button>
                        </div>
                        {(self || lastAdmin) && (
                          <small className="user-management-hint">
                            {lastAdmin
                              ? 'Last active administrator'
                              : 'Your current account'}
                          </small>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {users.data.length === 0 && (
              <p>No users yet. Create the first account to get started.</p>
            )}
          </div>
        )}
      </div>
      {action && (
        <UserActionDialog
          action={action}
          onClose={() => setAction(null)}
          onSuccess={(text, sessionChanged) => {
            setAction(null);
            setMessage(text);
            if (sessionChanged) {
              void queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
            } else {
              void users.refetch();
            }
          }}
        />
      )}
    </section>
  );
}
