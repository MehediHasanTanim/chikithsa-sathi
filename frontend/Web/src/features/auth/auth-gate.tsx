'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { LoadingState } from '@/components/ui/status';
import { useSessionStore } from '@/stores/session-store';

export function AuthGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, hydrated, onboarding } = useSessionStore();
  useEffect(() => {
    if (!hydrated) return;
    if (!user) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    else if (onboarding && !onboarding.complete) router.replace('/onboarding');
  }, [hydrated, onboarding, pathname, router, user]);
  if (!hydrated || !user || (onboarding && !onboarding.complete))
    return <LoadingState label="Preparing your workspace…" />;
  return children;
}
