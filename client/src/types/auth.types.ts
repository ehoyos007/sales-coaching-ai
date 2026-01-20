// Auth-specific types
// Note: UserRole, UserProfile, and Team are defined in types/index.ts

export interface AuthUser {
  id: string;
  email: string;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

export interface SignInResponse {
  success: boolean;
  data?: {
    user: AuthUser;
    profile: import('./index').UserProfile;
    session: AuthSession;
  };
  error?: string;
}

export interface SignUpResponse {
  success: boolean;
  data?: {
    user: AuthUser | null;
  };
  message?: string;
  error?: string;
}

export interface MeResponse {
  success: boolean;
  data?: {
    user: AuthUser;
    profile: import('./index').UserProfile;
  };
  error?: string;
}
