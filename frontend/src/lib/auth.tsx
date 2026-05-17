import { createContext, startTransition, useContext, useEffect, useMemo, useRef, useState } from "react";
import { api, ApiError, setRefreshTokenHandler } from "./api";
import { clearStoredToken, getStoredRefreshToken, getStoredToken, setStoredTokens } from "./storage";
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

function getRefreshDelay(token: string) {
  try {
    const encodedPayload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const paddedPayload = encodedPayload.padEnd(Math.ceil(encodedPayload.length / 4) * 4, "=");
    const payload = JSON.parse(window.atob(paddedPayload)) as { exp?: number };
    if (!payload.exp) {
      return null;
    }

    return Math.max(payload.exp * 1000 - Date.now() - 30_000, 0);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const refreshInFlightRef = useRef<Promise<string> | null>(null);

  const applyTokenPair = (accessToken: string, refreshToken: string) => {
    setStoredTokens(accessToken, refreshToken);
    setToken(accessToken);
  };

  const refreshAccessToken = async () => {
    if (refreshInFlightRef.current) {
      return refreshInFlightRef.current;
    }

    const refreshToken = getStoredRefreshToken();
    if (!refreshToken) {
      throw new ApiError("Missing refresh token", 401);
    }

    const refreshTask = (async () => {
      const result = await api.refreshToken(refreshToken);
      applyTokenPair(result.access_token, result.refresh_token);
      return result.access_token;
    })();

    refreshInFlightRef.current = refreshTask;

    try {
      return await refreshTask;
    } finally {
      refreshInFlightRef.current = null;
    }
  };

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
      const storedRefreshToken = getStoredRefreshToken();

      if (!storedRefreshToken) {
        startTransition(() => {
          setCurrentUser(null);
          setReady(true);
        });
        return;
      }
    }

    try {
      let activeToken = token;
      let user: User;

      if (!activeToken) {
        activeToken = await refreshAccessToken();
      }

      try {
        user = await api.getMe(activeToken);
      } catch (error) {
        if (!(error instanceof ApiError) || error.status !== 401) {
          throw error;
        }

        activeToken = await refreshAccessToken();
        user = await api.getMe(activeToken);
      }

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

  useEffect(() => {
    if (!token) {
      return;
    }

    const delay = getRefreshDelay(token);
    if (delay === null) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void refreshAccessToken().catch((error) => {
        logout();
        if (error instanceof ApiError) {
          setAuthError(error.message);
        }
      });
    }, delay);

    return () => window.clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    setRefreshTokenHandler(refreshAccessToken);
    return () => setRefreshTokenHandler(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      currentUser,
      ready,
      authError,
      async login(username, password) {
        const result = await api.login(username, password);
        applyTokenPair(result.access_token, result.refresh_token);
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
