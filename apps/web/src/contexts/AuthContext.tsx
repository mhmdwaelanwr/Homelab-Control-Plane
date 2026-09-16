import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';

import { clearToken, readToken, writeToken } from '@/lib/auth';
import { getSession, login as loginRequest, logout as logoutRequest } from '@/services/auth';

type AuthUser = {
  username: string;
  role: 'local-admin' | 'local-viewer';
};

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  sessionMeta: {
    createdAt: number;
    lastSeenAt: number;
  } | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [token, setToken] = useState<string | null>(() => readToken());
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionMeta, setSessionMeta] = useState<AuthContextValue['sessionMeta']>(null);

  useEffect(() => {
    async function hydrateSession() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const session = await getSession();
        if (!session.authenticated) {
          clearToken();
          setToken(null);
          setUser(null);
          setSessionMeta(null);
        } else {
          setUser(session.user);
          setSessionMeta(session.session);
        }
      } catch {
        clearToken();
        setToken(null);
        setUser(null);
        setSessionMeta(null);
      } finally {
        setLoading(false);
      }
    }

    void hydrateSession();
  }, [token]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      loading,
      sessionMeta,
      async login(username: string, password: string) {
        const response = await loginRequest(username, password);
        writeToken(response.token);
        setToken(response.token);
        setUser(response.user);
        const session = await getSession();
        setSessionMeta(session.session);
      },
      async logout() {
        try {
          if (token) {
            await logoutRequest();
          }
        } catch {
          // Clear local session even if the backend session is already gone.
        }
        clearToken();
        setToken(null);
        setUser(null);
        setSessionMeta(null);
      },
    }),
    [loading, sessionMeta, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
