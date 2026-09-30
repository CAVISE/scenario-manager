import { createContext, useContext } from 'react';
import type { CurrentUser } from '@/api/types/authTypes';

export interface AuthContextValue {
  user: CurrentUser;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const value = useContext(AuthContext);
  if (value === null) {
    throw new Error('useAuth must be used inside AuthGate');
  }
  return value;
}
