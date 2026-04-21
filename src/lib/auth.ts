"use client";

export type UserRole = "student" | "admin";

export type AuthUser = {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
};

type AuthStorage = {
  token: string;
  user: AuthUser;
};

const AUTH_STORAGE_KEY = "examhub_auth";

function safeJsonParse(value: string): AuthStorage | null {
  try {
    const parsed = JSON.parse(value) as AuthStorage;
    if (!parsed?.token || !parsed?.user?.role) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function getAuthStorage(): AuthStorage | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;
  return safeJsonParse(raw);
}

export function saveAuthStorage(data: AuthStorage) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
}

export function clearAuthStorage() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function getToken(): string | null {
  return getAuthStorage()?.token ?? null;
}

export function getCurrentRole(): UserRole | null {
  return getAuthStorage()?.user.role ?? null;
}

