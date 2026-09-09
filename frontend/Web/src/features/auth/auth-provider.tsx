'use client';

import { useEffect, type ReactNode } from 'react';
import { restoreSession } from '@/features/auth/session';
import { useSessionStore } from '@/stores/session-store';

export function AuthProvider({ children }: { children: ReactNode }) {
  const setHydrated = useSessionStore((state) => state.setHydrated);
  useEffect(() => {
    void restoreSession().finally(() => setHydrated(true));
  }, [setHydrated]);
  return children;
}
