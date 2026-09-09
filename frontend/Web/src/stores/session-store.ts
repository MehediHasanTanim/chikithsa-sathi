'use client';

import { create } from 'zustand';
import type { AuthSession, AuthTokens, AuthUser, OnboardingProgress } from '@/types/auth';

type SessionState = {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  onboarding: OnboardingProgress | null;
  hydrated: boolean;
  setSession: (session: AuthSession) => void;
  updateTokens: (tokens: AuthTokens) => void;
  setOnboarding: (progress: OnboardingProgress | null) => void;
  setHydrated: (hydrated: boolean) => void;
  clearSession: () => void;
};

export const useSessionStore = create<SessionState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  onboarding: null,
  hydrated: false,
  setSession: ({ user, ...tokens }) => set({ user, ...tokens }),
  updateTokens: (tokens) => set(tokens),
  setOnboarding: (onboarding) => set({ onboarding }),
  setHydrated: (hydrated) => set({ hydrated }),
  clearSession: () => set({ user: null, accessToken: null, refreshToken: null, onboarding: null }),
}));
