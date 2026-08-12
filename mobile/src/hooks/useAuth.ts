import { useState, useEffect, createContext, useContext } from "react";
import { apiFetch, saveToken, deleteToken, getToken } from "../lib/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface AuthState {
  token: string | null;
  loading: boolean;
}

interface LoginResult {
  ok: boolean;
  error?: string;
}

interface AuthContext extends AuthState {
  login: (phone: string, password: string) => Promise<LoginResult>;
  loginWithOtp: (phone: string, code: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
  sendOtp: (phone: string) => Promise<{ ok: boolean; error?: string }>;
  register: (data: {
    phone: string;
    password: string;
    displayName: string;
  }) => Promise<{ ok: boolean; error?: string }>;
}

import React from "react";

const Ctx = createContext<AuthContext | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ token: null, loading: true });

  useEffect(() => {
    getToken().then((t) => setState({ token: t, loading: false }));
  }, []);

  async function login(phone: string, password: string): Promise<LoginResult> {
    const { data, error } = await apiFetch<{ token: string }>(
      "/api/auth/login",
      {
        method: "POST",
        body: JSON.stringify({ phone, password }),
      }
    );
    if (error || !data?.token) return { ok: false, error: error ?? "Erreur" };
    await saveToken(data.token);
    setState({ token: data.token, loading: false });
    return { ok: true };
  }

  async function loginWithOtp(
    phone: string,
    code: string
  ): Promise<LoginResult> {
    const { data, error } = await apiFetch<{ token: string }>(
      "/api/auth/otp/verify",
      {
        method: "POST",
        body: JSON.stringify({ phone, code }),
      }
    );
    if (error || !data?.token) return { ok: false, error: error ?? "Erreur" };
    await saveToken(data.token);
    setState({ token: data.token, loading: false });
    return { ok: true };
  }

  async function sendOtp(phone: string) {
    const { error } = await apiFetch("/api/auth/otp/send", {
      method: "POST",
      body: JSON.stringify({ phone }),
    });
    if (error) return { ok: false, error };
    return { ok: true };
  }

  async function register(data: {
    phone: string;
    password: string;
    displayName: string;
  }) {
    const { error } = await apiFetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (error) return { ok: false, error };
    return { ok: true };
  }

  async function logout() {
    await apiFetch("/api/auth/logout", { method: "POST" });
    await deleteToken();
    // Nettoyer l'AsyncStorage pour éviter des problèmes au prochain login
    await AsyncStorage.removeItem("hasCompletedOnboarding");
    await AsyncStorage.removeItem("activeProfileId");
    await AsyncStorage.removeItem("@sunuagri_active_profile");
    setState({ token: null, loading: false });
  }

  return React.createElement(
    Ctx.Provider,
    { value: { ...state, login, loginWithOtp, sendOtp, register, logout } },
    children
  );
}

export function useAuth(): AuthContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth doit être utilisé dans AuthProvider");
  return ctx;
}
