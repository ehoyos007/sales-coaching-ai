import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import type { AuthUser, UserProfile, UserRole } from '../types';
import {
  signIn as apiSignIn,
  signUp as apiSignUp,
  signOut as apiSignOut,
  getMe,
  getToken,
  clearToken,
} from '../services/api';

// Combined user object that merges AuthUser with profile data for convenience
export interface CombinedUser {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  teamId: string | null;
  teamName: string | null;
}

interface AuthContextValue {
  user: CombinedUser | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  // Aliases for backwards compatibility
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

// Helper function to create combined user from auth user and profile
function createCombinedUser(authUser: AuthUser, profile: UserProfile): CombinedUser {
  const fullName = profile.first_name
    ? profile.last_name
      ? `${profile.first_name} ${profile.last_name}`
      : profile.first_name
    : null;

  return {
    id: authUser.id,
    email: authUser.email,
    name: fullName,
    role: profile.role,
    teamId: profile.team_id,
    teamName: profile.team?.name ?? null,
  };
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = useMemo(() => authUser !== null, [authUser]);

  // Combined user object for convenience
  const user = useMemo<CombinedUser | null>(() => {
    if (!authUser || !profile) return null;
    return createCombinedUser(authUser, profile);
  }, [authUser, profile]);

  const refreshProfile = useCallback(async () => {
    try {
      const response = await getMe();
      if (response.success && response.data) {
        setAuthUser(response.data.user);
        setProfile(response.data.profile);
      } else {
        // Clear state if refresh fails
        setAuthUser(null);
        setProfile(null);
        clearToken();
      }
    } catch {
      // Clear state on error
      setAuthUser(null);
      setProfile(null);
      clearToken();
    }
  }, []);

  // On mount: check if token exists and validate it
  useEffect(() => {
    const initAuth = async () => {
      const token = getToken();
      if (token) {
        try {
          const response = await getMe();
          if (response.success && response.data) {
            setAuthUser(response.data.user);
            setProfile(response.data.profile);
          } else {
            // Token is invalid, clear it
            clearToken();
          }
        } catch {
          // Token validation failed, clear it
          clearToken();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const response = await apiSignIn(email, password);

    if (!response.success) {
      throw new Error(response.error || 'Sign in failed');
    }

    if (response.data) {
      setAuthUser(response.data.user);
      setProfile(response.data.profile);
    }
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, fullName?: string) => {
      const response = await apiSignUp(email, password, fullName);

      if (!response.success) {
        throw new Error(response.error || 'Sign up failed');
      }

      // Note: Sign up might require email confirmation,
      // so we don't automatically sign the user in
    },
    []
  );

  const signOut = useCallback(async () => {
    try {
      await apiSignOut();
    } catch {
      // Even if the API call fails, we should clear local state
    } finally {
      setAuthUser(null);
      setProfile(null);
      clearToken();
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      isAuthenticated,
      isLoading,
      signIn,
      signUp,
      signOut,
      refreshProfile,
      // Aliases for backwards compatibility
      login: signIn,
      register: signUp,
    }),
    [user, profile, isAuthenticated, isLoading, signIn, signUp, signOut, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}

// Export useAuth as an alias of useAuthContext for backwards compatibility
export const useAuth = useAuthContext;

export { AuthContext };
