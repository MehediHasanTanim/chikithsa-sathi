'use client';

import { authRepository } from '@/repositories/auth.repository';
import { useSessionStore } from '@/stores/session-store';
import type { AuthSession } from '@/types/auth';

const STORAGE_KEY = 'carechamber.refresh-token';
const USER_KEY = 'carechamber.session-user';
let refreshInFlight: Promise<void> | null = null;

function refreshStorage(remember: boolean) {
  return remember ? localStorage : sessionStorage;
}
function readStorage() {
  return localStorage.getItem(STORAGE_KEY) ? localStorage : sessionStorage;
}
function readRefreshToken() {
  return readStorage().getItem(STORAGE_KEY);
}
function clearStoredToken() {
  localStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(USER_KEY);
}

export function establishSession(session: AuthSession, remember: boolean) {
  clearStoredToken();
  const storage = refreshStorage(remember);
  storage.setItem(STORAGE_KEY, session.refreshToken);
  storage.setItem(USER_KEY, JSON.stringify(session.user));
  useSessionStore.getState().setSession(session);
}

export async function restoreSession() {
  const refreshToken = readRefreshToken();
  if (!refreshToken) return;
  if (!refreshInFlight)
    refreshInFlight = (async () => {
      try {
        const tokens = await authRepository.refresh(refreshToken);
        const storage = readStorage();
        storage.setItem(STORAGE_KEY, tokens.refreshToken);
        const user = storage.getItem(USER_KEY);
        if (user) useSessionStore.setState({ user: JSON.parse(user) });
        useSessionStore.getState().updateTokens(tokens);
        const progress = await authRepository.onboarding(tokens.accessToken);
        useSessionStore.getState().setOnboarding(progress);
      } catch {
        clearStoredToken();
        useSessionStore.getState().clearSession();
      } finally {
        refreshInFlight = null;
      }
    })();
  return refreshInFlight;
}

export async function endSession() {
  const { accessToken, refreshToken } = useSessionStore.getState();
  try {
    if (accessToken && refreshToken) await authRepository.logout(refreshToken, accessToken);
  } finally {
    clearStoredToken();
    useSessionStore.getState().clearSession();
  }
}
