'use client';

import { create } from 'zustand';

export type SessionUser = { id: string; name: string; email: string; role: string };

type SessionState = {
  user: SessionUser | null;
  accessToken: string | null;
  setSession: (user: SessionUser, accessToken: string) => void;
  clearSession: () => void;
};

export const useSessionStore = create<SessionState>((set) => ({
  user: null,
  accessToken: null,
  setSession: (user, accessToken) => set({ user, accessToken }),
  clearSession: () => set({ user: null, accessToken: null }),
}));
