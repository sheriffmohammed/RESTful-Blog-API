import { createContext, startTransition, useContext, useEffect, useMemo, useState } from "react";
import { api, ApiError } from "./api";
import { clearStoredToken, getStoredToken, setStoredToken } from "./storage";
import type { RegisterPayload, User } from "./types";

type AuthContextValue = {
  token: string | null;
  currentUser: User | null;
  ready: boolean;
  authError: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const logout = () => {
    clearStoredToken();
    startTransition(() => {
      setToken(null);
      setCurrentUser(null);
      setAuthError(null);
    });
  };

  const refreshUser = async () => {
    if (!token) {
      startTransition(() => {
        setCurrentUser(null);
        setReady(true);
      });
      return;
    }

    try {
      const user = await api.getMe(token);
      startTransition(() => {
        setCurrentUser(user);
        setAuthError(null);
      });
    } catch (error) {
      logout();
      if (error instanceof ApiError) {
        setAuthError(error.message);
      }
    } finally {
      setReady(true);
    }
  };

  useEffect(() => {
    void refreshUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      currentUser,
      ready,
      authError,
      async login(username, password) {
        const result = await api.login(username, password);
        setStoredToken(result.access_token);
        setToken(result.access_token);
        setReady(false);
      },
      async register(payload) {
        await api.register(payload);
      },
      logout,
      refreshUser,
    }),
    [authError, currentUser, ready, token],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
