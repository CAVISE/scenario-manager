import { api } from './client';
import type { CurrentUser, UserRole } from './types/authTypes';

export interface ManagedUser {
  id: number;
  login: string;
  role: UserRole;
  is_admin: boolean;
  is_active: boolean;
}

export function listUsers() {
  return api.get('api/auth/users').json<ManagedUser[]>();
}

export function createUser(login: string, password: string, role: UserRole) {
  return api
    .post('api/auth/users', { json: { login, password, role } })
    .json<CurrentUser>();
}

export function updateUser(id: number, login: string, role: UserRole) {
  return api
    .patch(`api/auth/users/${id}`, { json: { login, role } })
    .json<ManagedUser>();
}

export function setUserActive(id: number, is_active: boolean) {
  return api
    .patch(`api/auth/users/${id}/status`, { json: { is_active } })
    .json<ManagedUser>();
}

export async function resetUserPassword(id: number, new_password: string) {
  await api.post(`api/auth/users/${id}/reset-password`, {
    json: { new_password },
  });
}

export async function changePassword(
  current_password: string,
  new_password: string
) {
  await api.post('api/auth/change-password', {
    json: { current_password, new_password },
  });
}
