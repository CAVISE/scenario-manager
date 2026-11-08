import { api } from './client';
import type { CurrentUser, LoginResponse } from './types/authTypes';

export function getCurrentUser() {
  return api.get('api/auth/me').json<CurrentUser>();
}

export async function login(login: string, password: string) {
  await api
    .post('api/auth/login', { json: { login, password } })
    .json<LoginResponse>();
}

export async function logout() {
  await api.post('api/auth/logout');
}
