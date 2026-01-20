import { useMemo } from 'react';
import { useAuthContext } from '../contexts/AuthContext';

export function useAuth() {
  const auth = useAuthContext();

  const isAdmin = useMemo(() => auth.user?.role === 'admin', [auth.user?.role]);

  const isManager = useMemo(() => auth.user?.role === 'manager', [auth.user?.role]);

  const isAgent = useMemo(() => auth.user?.role === 'agent', [auth.user?.role]);

  const canAccessTeamData = useMemo(
    () => auth.user?.role === 'admin' || auth.user?.role === 'manager',
    [auth.user?.role]
  );

  return {
    ...auth,
    isAdmin,
    isManager,
    isAgent,
    canAccessTeamData,
  };
}
