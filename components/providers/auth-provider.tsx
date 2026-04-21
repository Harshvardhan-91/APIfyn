"use client";

import { apiFetch } from "@/lib/api/client";
import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";
import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type AppUser = {
  id?: string;
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  emailVerified?: boolean;
  createdAt?: string;
  token: string;
};

type AuthContextValue = {
  user: AppUser | null;
  loading: boolean;
  error: string | null;
  login: () => void;
  logout: () => Promise<void>;
  refreshToken: () => Promise<string>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = "apifyn_token";

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return value;
}

function AuthProviderInner({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const restoreSession = useCallback(async () => {
    const saved = localStorage.getItem(TOKEN_KEY);
    if (!saved) {
      setLoading(false);
      return;
    }

    try {
      const data = await apiFetch<{ user: Omit<AppUser, "token"> }>(
        "/api/auth/me",
        { token: saved },
      );
      setUser({ ...data.user, token: saved });
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setError(null);
      setLoading(true);

      try {
        const data = await apiFetch<{
          token: string;
          user: Omit<AppUser, "token">;
        }>("/api/auth/google", {
          method: "POST",
          body: JSON.stringify({
            credential: tokenResponse.access_token,
          }),
        });

        localStorage.setItem(TOKEN_KEY, data.token);
        setUser({ ...data.user, token: data.token });
      } catch (loginError) {
        setError(
          loginError instanceof Error
            ? loginError.message
            : "Authentication failed",
        );
      } finally {
        setLoading(false);
      }
    },
    onError: (errorResponse) => {
      setError(errorResponse.error_description ?? "Google login failed");
    },
  });

  function login() {
    setError(null);
    googleLogin();
  }

  async function logout() {
    setError(null);
    const token = user?.token;
    if (token) {
      await apiFetch("/api/auth/signout", {
        method: "POST",
        token,
      }).catch(() => undefined);
    }
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }

  async function refreshToken() {
    const saved = localStorage.getItem(TOKEN_KEY);
    if (!saved) throw new Error("No authenticated user found");
    return saved;
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, error, login, logout, refreshToken }}
    >
      {children}
    </AuthContext.Provider>
  );
}

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProviderInner>{children}</AuthProviderInner>
    </GoogleOAuthProvider>
  );
}
