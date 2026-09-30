export type UserRole = 'admin' | 'operator' | 'viewer';

export interface CurrentUser {
  email: string;
  role: UserRole;
  authentication_enabled: boolean;
}

interface LoginResponse {
  access_token: string;
  token_type: 'bearer';
  expires_in: number;
}

export type { LoginResponse };
